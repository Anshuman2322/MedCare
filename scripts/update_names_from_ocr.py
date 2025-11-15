"""
Update product names in src/data/medicines.json using OCR from product images.

This script reads medicines.json, runs OCR on each product's first available image,
extracts a likely display name (e.g., "Iressa Tablet", "Rolimus Everolimus"),
and optionally updates the JSON file. By default it performs a dry run and prints
the proposed changes.

Requirements:
  - Python packages: pillow, pytesseract
  - Tesseract OCR engine installed on the system

Install on Windows (PowerShell):
  winget install -e --id UB-Mannheim.Tesseract-OCR
  pip install pillow pytesseract

Usage examples:
  # Preview proposed name updates without writing
  py scripts/update_names_from_ocr.py --root "s:\\MedCare" --json "src\\data\\medicines.json"

  # Apply changes to medicines.json in-place
  py scripts/update_names_from_ocr.py --root "s:\\MedCare" --json "src\\data\\medicines.json" --apply

Notes:
  - The script uses the `images` array in medicines.json when available; falls back to `image`.
  - Heuristics aim for practical accuracy but may require manual review.
"""
from __future__ import annotations
import os
import re
import json
import argparse
from typing import Tuple, Optional

try:
    from PIL import Image
    import pytesseract
except Exception as e:  # pragma: no cover - optional dependency notification
    Image = None
    pytesseract = None


def load_json(path: str):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


DOSAGE_RE = re.compile(r"\b\d+\s*(?:mg|ml|g)\b", re.IGNORECASE)
FORM_WORDS = [
    "Tablet", "Tablets", "Capsule", "Capsules", "Injection", "Injections",
    "Gel", "Cream", "Syrup", "Suspension"
]


def ocr_image(path: str) -> str:
    if Image is None or pytesseract is None:
        raise RuntimeError("pytesseract and pillow are required. See script header for install steps.")
    img = Image.open(path)
    # Simple pre-processing: convert to grayscale
    img = img.convert("L")
    # OCR
    text = pytesseract.image_to_string(img)
    return text


def extract_name_brand(text: str) -> Tuple[Optional[str], Optional[str]]:
    # Consider line-based analysis
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    best_line = None
    for ln in lines:
        for w in FORM_WORDS:
            if w.lower() in ln.lower():
                best_line = ln
                break
        if best_line:
            break
    if not best_line and lines:
        # fallback: pick the longest reasonable line
        best_line = max(lines, key=len)

    if not best_line:
        return None, None

    # Remove dosage tokens and excessive symbols
    cleaned = DOSAGE_RE.sub("", best_line)
    cleaned = re.sub(r"[^A-Za-z0-9 +\-]", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()

    # If the line contains a form word, trim to include the form word at end
    form_pos = None
    form_word = None
    for w in FORM_WORDS:
        m = re.search(rf"\b{re.escape(w)}\b", cleaned, re.IGNORECASE)
        if m:
            form_pos = m.end()
            form_word = w
            break
    if form_pos:
        candidate = cleaned[:form_pos]
    else:
        candidate = cleaned

    # Title case with minor tweaks
    name = " ".join(s.capitalize() for s in candidate.split())

    # Brand heuristic: Find common pharma brand words on separate lines
    BRAND_HINTS = [
        "Cipla", "Sun Pharma", "Sun", "Torrent", "Dr Reddy", "Intas", "Zydus",
        "Glenmark", "Lupin", "Mankind", "Abbott", "Pfizer", "Novartis", "AstraZeneca"
    ]
    brand = None
    for ln in lines[:5]:  # top lines usually include branding
        for b in BRAND_HINTS:
            if b.lower() in ln.lower():
                brand = b
                break
        if brand:
            break

    return (name if name else None), brand


def main():
    ap = argparse.ArgumentParser(description="Update medicine names from OCR of images.")
    ap.add_argument("--root", required=True, help="Project root path. Used to resolve /medicines paths.")
    ap.add_argument("--json", default=os.path.join("src", "data", "medicines.json"), help="Path to medicines.json")
    ap.add_argument("--apply", action="store_true", help="Write changes back to JSON")
    ap.add_argument("--limit", type=int, default=0, help="Limit number of entries to process (0=all)")
    args = ap.parse_args()

    data = load_json(args.json)
    updated = 0

    for i, item in enumerate(data):
        if args.limit and i >= args.limit:
            break
        images = item.get("images") or ([item.get("image")] if item.get("image") else [])
        if not images:
            continue
        # Resolve first image path under root/public
        img_rel = images[0].lstrip("/")  # e.g., medicines/slug/file.jpg
        img_path = os.path.join(args.root, "public", img_rel.replace("/", os.sep))
        if not os.path.exists(img_path):
            # Try direct relative to root
            img_path = os.path.join(args.root, img_rel.replace("/", os.sep))
            if not os.path.exists(img_path):
                print(f"[skip] image not found for {item.get('id')}: {images[0]}")
                continue

        try:
            text = ocr_image(img_path)
        except Exception as e:
            print(f"[error] OCR failed for {item.get('id')}: {e}")
            continue

        new_name, brand = extract_name_brand(text)
        if not new_name:
            print(f"[info] No name detected for {item.get('id')} (kept: {item.get('name')})")
            continue

        old_name = item.get("name")
        if new_name != old_name or (brand and not item.get("brand")):
            print(f"[change] {item.get('id')}: '{old_name}' -> '{new_name}'" + (f" | brand: {brand}" if brand else ""))
            if args.apply:
                item["name"] = new_name
                if brand:
                    item["brand"] = brand
                updated += 1

    if args.apply:
        with open(args.json, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        print(f"Updated {updated} entries and wrote to {args.json}")
    else:
        print("Dry run complete. Use --apply to write changes.")


if __name__ == "__main__":
    main()
