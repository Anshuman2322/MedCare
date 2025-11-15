"""Generate medicines.json from categorized medicine folders and copy representative images.

Scans a base directory with category subfolders created by categorize_medicines.py.
For each medicine folder:
  - Picks first image file (*.jpg, *.jpeg, *.png, *.webp) as representative
  - Copies it to public/medicines/<slug>/<original_filename>
  - Generates an entry in src/data/medicines.json with fields required by frontend

Heuristics:
  - Display category name derived from folder (replace '_' with spaces, title-case, custom map)
  - Form inferred from folder name keywords
    - Human-readable name derived from folder name (retain dosage tokens like '100mg', '30mg', '60mg')
  - Price placeholder based on category group (allows UI to render; adjust later)

Usage (PowerShell):
  py .\scripts\generate_medicines_json.py --base-dir "s:\MedCare\final_web" --public-dir "s:\MedCare\public" --output "s:\MedCare\src\data\medicines.json" --copy-images

Dry run (no file writes, only summary):
  py .\scripts\generate_medicines_json.py --base-dir "s:\MedCare\final_web" --dry-run
"""
from __future__ import annotations
import os
import re
import json
import shutil
import argparse
from typing import List, Dict, Optional

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}

CATEGORY_DISPLAY_MAP = {
    "Erectile_Dysfunction": "Erectile Dysfunction",
    "Pain_Killer": "Pain Relief",
    "Anti_Biotic": "Antibiotics",
    "Hormones_And_Steroids": "Hormones & Steroids",
    "Anti_Cancer": "Anti Cancer",
    "Anti_Viral": "Anti Viral",
    "Anti_Malarial": "Anti Malarial",
    "Injections": "Injections",
    "Skin_Allergy_Asthma": "Skin / Allergy / Asthma",
    "Supplements_Vitamins_Hair": "Supplements & Hair",
    "Chronic_Cardiac": "Chronic / Cardiac",
    "Unclear": "Uncategorized",
}

CATEGORY_BASE_PRICE = {
    "Erectile Dysfunction": 18.0,
    "Pain Relief": 12.0,
    "Antibiotics": 16.0,
    "Hormones & Steroids": 22.0,
    "Anti Cancer": 45.0,
    "Anti Viral": 30.0,
    "Anti Malarial": 28.0,
    "Injections": 35.0,
    "Skin / Allergy / Asthma": 14.0,
    "Supplements & Hair": 20.0,
    "Chronic / Cardiac": 25.0,
    "Uncategorized": 10.0,
}

DOSAGE_PATTERN = re.compile(r"(\b\d+\s*mg\b|\b\d+\s*ml\b|\b\d+\s*g\b)", re.IGNORECASE)

FORM_KEYWORDS = {
    "Tablet": ["tablet", "tabs"],
    "Capsule": ["capsule", "capsules"],
    "Injection": ["injection"],
    "Gel": ["gel"],
    "Cream": ["cream"],
    "Liquid": ["syrup", "suspension"],
}


def infer_form(name: str) -> str:
    low = name.lower()
    for form, kws in FORM_KEYWORDS.items():
        for kw in kws:
            if kw in low:
                return form
    return "Tablet"


def extract_dosage(raw: str) -> Optional[str]:
    m = DOSAGE_PATTERN.search(raw)
    if not m:
        return None
    token = m.group(0).lower().replace("ml", "ml").replace("mg", "mg").replace("g", "g")
    # Normalize spacing: e.g., '250mg' -> '250 mg'
    token = re.sub(r"(\d+)\s*(mg|ml|g)", r"\1 \2", token)
    return token


def clean_base_name(raw: str) -> str:
    name = raw.replace("-", " ").replace("_", " ")
    name = re.sub(r"\s+", " ", name)
    # Remove dosage tokens for base name; we'll append later
    name = DOSAGE_PATTERN.sub("", name)
    name = name.strip()
    return " ".join(w.capitalize() for w in name.split())


def slugify(raw: str) -> str:
    slug = raw.lower().strip()
    slug = slug.replace(" ", "-")
    slug = slug.replace("_", "-")
    slug = re.sub(r"[^a-z0-9\-]", "", slug)
    slug = re.sub(r"-+", "-", slug)
    return slug


def find_images(folder: str) -> List[str]:
    files: List[str] = []
    try:
        for entry in sorted(os.listdir(folder)):
            p = os.path.join(folder, entry)
            if os.path.isfile(p):
                _, ext = os.path.splitext(entry)
                if ext.lower() in IMAGE_EXTS:
                    files.append(entry)
    except FileNotFoundError:
        return []
    return files


def build_entry(cat_folder: str, med_folder: str, display_category: str, base_dir: str, public_dir: str, copy_images: bool) -> Dict:
    full_path = os.path.join(base_dir, cat_folder, med_folder)
    image_files = find_images(full_path)
    slug = slugify(med_folder)
    image_rel = None
    images_rel: List[str] = []
    if image_files:
        target_dir = os.path.join(public_dir, "medicines", slug)
        if copy_images:
            os.makedirs(target_dir, exist_ok=True)
        for fname in image_files:
            rel = f"/medicines/{slug}/{fname}"
            images_rel.append(rel)
            if copy_images:
                src = os.path.join(full_path, fname)
                dst = os.path.join(target_dir, fname)
                if not os.path.exists(dst):
                    shutil.copy2(src, dst)
        image_rel = images_rel[0] if images_rel else None
    dosage = extract_dosage(med_folder)
    display_name = clean_base_name(med_folder)
    if dosage:
        # Append dosage at end in standardized format, e.g., "Iressa Tablet 250 mg"
        display_name = f"{display_name} {dosage}".strip()
    return {
        "id": slug,
        "name": display_name,
        "category": display_category,
        "brand": None,
        "form": infer_form(med_folder),
        "packaging": None,
        "composition": None,
        "price": CATEGORY_BASE_PRICE.get(display_category, 10.0),
        "inStock": True,
        "image": image_rel,
        "images": images_rel,
        "description": "Auto imported medicine. Update details.",
        "dosage": dosage,
        "usage": None,
        "details": None,
    }


def main():
    parser = argparse.ArgumentParser(description="Generate medicines.json from categorized folders")
    parser.add_argument("--base-dir", required=True, help="Path to categorized final_web directory")
    parser.add_argument("--public-dir", default="public", help="Path to Vite public directory")
    parser.add_argument("--output", default=os.path.join("src", "data", "medicines.json"), help="Output JSON file path")
    parser.add_argument("--copy-images", action="store_true", help="Copy representative images into public/medicines")
    parser.add_argument("--dry-run", action="store_true", help="Preview without writing or copying")
    args = parser.parse_args()

    base_dir = args.base_dir
    public_dir = args.public_dir
    output_file = args.output

    if not os.path.isdir(base_dir):
        print(f"ERROR: Base directory not found: {base_dir}")
        return

    categories = [d for d in sorted(os.listdir(base_dir)) if os.path.isdir(os.path.join(base_dir, d))]
    entries: List[Dict] = []
    skipped = 0

    for cat in categories:
        display_category = CATEGORY_DISPLAY_MAP.get(cat, cat.replace("_", " "))
        cat_path = os.path.join(base_dir, cat)
        meds = [m for m in sorted(os.listdir(cat_path)) if os.path.isdir(os.path.join(cat_path, m))]
        for med in meds:
            entry = build_entry(cat, med, display_category, base_dir, public_dir, copy_images=not args.dry_run and args.copy_images)
            if entry["image"] is None:
                skipped += 1
            entries.append(entry)

    print(f"Processed {len(entries)} medicines. Missing images: {skipped}.")

    if args.dry_run:
        print("Dry run complete. Not writing output.")
        return

    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(entries, f, indent=2)
    print(f"Wrote {len(entries)} entries to {output_file}")


if __name__ == "__main__":
    main()
