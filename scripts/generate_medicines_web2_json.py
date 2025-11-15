"""Generate medicines_web2.json from categorized medicine folders in final_web_2 and copy representative images.

Scans final_web_2 directory with category subfolders created by categorize_medicines_web2.py.
For each medicine folder:
  - Picks first image file (*.jpg, *.jpeg, *.png, *.webp) as representative
  - Copies it to public/medicines_web2/<slug>/<original_filename>
  - Generates an entry in src/data/medicines_web2.json with fields required by frontend

Heuristics:
  - Display category name derived from folder (replace '_' with spaces, title-case, custom map)
  - Form inferred from folder name keywords
  - Human-readable name derived from folder name with standardized format: Medicine Name Dose
  - Price placeholder based on category group (allows UI to render; adjust later)

Usage (PowerShell):
  py .\scripts\generate_medicines_web2_json.py --base-dir "s:\MedCare\final_web_2\final_web_2" --public-dir "s:\MedCare\public" --output "s:\MedCare\src\data\medicines_web2.json" --copy-images

Dry run (no file writes, only summary):
  py .\scripts\generate_medicines_web2_json.py --base-dir "s:\MedCare\final_web_2\final_web_2" --dry-run
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
    "Antidepressant_Anti_Anxiety": "Antidepressant / Anti-Anxiety",
    "Sleep_Disorders": "Sleep Disorders",
    "Gastrointestinal": "Gastrointestinal",
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
    "Antidepressant / Anti-Anxiety": 15.0,
    "Sleep Disorders": 18.0,
    "Gastrointestinal": 12.0,
    "Uncategorized": 10.0,
}

# Updated dosage pattern to capture dosages at the end of folder names
DOSAGE_PATTERN = re.compile(r"(\b\d+(?:\.\d+)?\s*mg\b|\b\d+\s*ml\b|\b\d+\s*g\b)", re.IGNORECASE)

FORM_KEYWORDS = {
    "Tablet": ["tablet", "tabs"],
    "Capsule": ["capsule", "capsules"],
    "Injection": ["injection"],
    "Gel": ["gel"],
    "Cream": ["cream"],
    "Liquid": ["syrup", "suspension"],
    "Jelly": ["jelly"],
}


def infer_form(name: str) -> str:
    low = name.lower()
    for form, kws in FORM_KEYWORDS.items():
        for kw in kws:
            if kw in low:
                return form
    return "Tablet"


def extract_dosage(raw: str) -> Optional[str]:
    """Extract dosage from folder name, prioritizing dosage at the end."""
    # Look for dosage pattern at the end of the string
    end_match = re.search(r"(\d+(?:\.\d+)?\s*mg|\d+\s*ml|\d+\s*g)\s*$", raw, re.IGNORECASE)
    if end_match:
        token = end_match.group(1).lower()
        # Normalize spacing: e.g., '250mg' -> '250 mg'
        token = re.sub(r"(\d+(?:\.\d+)?)\s*(mg|ml|g)", r"\1 \2", token)
        return token
    
    # Fallback to any dosage in the string
    m = DOSAGE_PATTERN.search(raw)
    if not m:
        return None
    token = m.group(0).lower()
    # Normalize spacing: e.g., '250mg' -> '250 mg'
    token = re.sub(r"(\d+(?:\.\d+)?)\s*(mg|ml|g)", r"\1 \2", token)
    return token


def clean_base_name(raw: str) -> str:
    """Clean and format the medicine name following the pattern: Medicine Name"""
    name = raw.replace("-", " ").replace("_", " ")
    name = re.sub(r"\s+", " ", name)
    
    # Remove dosage tokens for base name; we'll append later in standardized format
    name = DOSAGE_PATTERN.sub("", name)
    
    # Remove form keywords as they'll be handled separately
    for form, kws in FORM_KEYWORDS.items():
        for kw in kws:
            name = re.sub(rf"\b{re.escape(kw)}\b", "", name, flags=re.IGNORECASE)
    
    name = name.strip()
    
    # Split into words and capitalize each appropriately
    words = name.split()
    cleaned_words = []
    
    for word in words:
        # Keep certain medical terms in specific formats
        word_lower = word.lower()
        if word_lower in ['hcl', 'ip', 'bp', 'usp']:
            cleaned_words.append(word.upper())
        elif len(word) > 1:
            cleaned_words.append(word.capitalize())
        elif word:
            cleaned_words.append(word.upper())
    
    return " ".join(cleaned_words)


def slugify(raw: str) -> str:
    slug = raw.lower().strip()
    slug = slug.replace(" ", "-")
    slug = slug.replace("_", "-")
    slug = re.sub(r"[^a-z0-9\-]", "", slug)
    slug = re.sub(r"-+", "-", slug)
    return slug.strip("-")


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
        target_dir = os.path.join(public_dir, "medicines_web2", slug)
        if copy_images:
            os.makedirs(target_dir, exist_ok=True)
        for fname in image_files:
            rel = f"/medicines_web2/{slug}/{fname}"
            images_rel.append(rel)
            if copy_images:
                src = os.path.join(full_path, fname)
                dst = os.path.join(target_dir, fname)
                if not os.path.exists(dst):
                    shutil.copy2(src, dst)
        image_rel = images_rel[0] if images_rel else None
    
    dosage = extract_dosage(med_folder)
    display_name = clean_base_name(med_folder)
    
    # Format: Medicine Name Dose (e.g., "Kamagra 100 mg", "Tadalafil 20 mg")
    if dosage:
        display_name = f"{display_name} {dosage}".strip()
    
    form = infer_form(med_folder)
    base_price = CATEGORY_BASE_PRICE.get(display_category, 10.0)
    
    return {
        "id": slug,
        "name": display_name,
        "category": display_category,
        "price": base_price,
        "form": form,
        "image": image_rel,
        "images": images_rel,
        "inStock": True,
        "description": f"{display_name} - {form}",
        "manufacturer": "Generic",
        "requiresPrescription": True,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate medicines_web2.json from categorized folders.")
    parser.add_argument("--base-dir", default=os.path.join(os.getcwd(), "final_web_2", "final_web_2"), help="Path to categorized medicine folders")
    parser.add_argument("--public-dir", default=os.path.join(os.getcwd(), "public"), help="Path to public directory")
    parser.add_argument("--output", default=os.path.join(os.getcwd(), "src", "data", "medicines_web2.json"), help="Output JSON file path")
    parser.add_argument("--copy-images", action="store_true", help="Copy images to public directory")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be done without writing files")
    
    args = parser.parse_args()

    base_dir = args.base_dir
    public_dir = args.public_dir
    output_path = args.output
    copy_images = args.copy_images
    dry_run = args.dry_run

    if not os.path.isdir(base_dir):
        print(f"ERROR: Base directory not found: {base_dir}")
        return

    medicines: List[Dict] = []
    total_found = 0
    categories_found = set()

    print(f"Scanning: {base_dir}")
    print(f"Copy images: {copy_images}")
    print(f"Output: {output_path}")
    
    try:
        category_dirs = sorted(os.listdir(base_dir))
    except Exception as e:
        print(f"ERROR: Cannot list base directory: {e}")
        return

    for cat_folder in category_dirs:
        cat_path = os.path.join(base_dir, cat_folder)
        if not os.path.isdir(cat_path):
            continue

        display_category = CATEGORY_DISPLAY_MAP.get(cat_folder, cat_folder.replace("_", " ").title())
        categories_found.add(display_category)

        try:
            med_folders = sorted(os.listdir(cat_path))
        except Exception as e:
            print(f"ERROR: Cannot list category '{cat_folder}': {e}")
            continue

        for med_folder in med_folders:
            med_path = os.path.join(cat_path, med_folder)
            if not os.path.isdir(med_path):
                continue

            total_found += 1
            if not dry_run:
                entry = build_entry(cat_folder, med_folder, display_category, base_dir, public_dir, copy_images)
                medicines.append(entry)
                print(f"✓ {entry['name']} ({display_category})")
            else:
                dosage = extract_dosage(med_folder)
                display_name = clean_base_name(med_folder)
                if dosage:
                    display_name = f"{display_name} {dosage}"
                print(f"DRY-RUN: {display_name} ({display_category})")

    print(f"\nSummary:")
    print(f"  Total medicines found: {total_found}")
    print(f"  Categories: {len(categories_found)} - {', '.join(sorted(categories_found))}")

    if not dry_run and medicines:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(medicines, f, indent=2, ensure_ascii=False)
        print(f"  Wrote: {output_path} ({len(medicines)} entries)")
    elif dry_run:
        print("  NOTE: This was a dry run. Use --copy-images to actually process files.")


if __name__ == "__main__":
    main()