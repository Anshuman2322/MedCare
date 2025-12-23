"""
Categorize medicine folders inside a base directory (default: ./final_web).

Features:
- Scans immediate subfolders of final_web
- Creates category folders if missing
- Moves folders into category based on name keyword matching (case-insensitive)
- Skips moving if already in the correct category
- Skips known category folders themselves
- Handles conflicts safely (skip if destination exists)
- Prints a clear summary at the end
- Optional: --dry-run to preview actions without moving
- Optional: --base-dir to change the base directory (default: ./final_web)

Usage (PowerShell on Windows):
  # Dry run (no changes)
  python .\scripts\categorize_medicines.py --dry-run --base-dir "S:\\final_web"

  # Real run (will move folders)
  python .\scripts\categorize_medicines.py --base-dir "S:\\final_web"

If you run from the project root and your final_web lives alongside the repo, adjust the --base-dir accordingly.
"""
from __future__ import annotations
import os
import shutil
import argparse
from typing import Dict, List, Tuple

# Ordered category list and keyword mapping
# Note: matching is substring-based (case-insensitive). Add common variants/hyphenations.
CATEGORY_KEYWORDS: List[Tuple[str, List[str]]] = [
    (
        "Erectile_Dysfunction",
        [
            "sildenafil",
            "tadalafil",
            "vardenafil",
            "avanafil",
            "dapoxetine",
            "cenforce",
            "fildena",
            "malegra",
            "p-force",
            "super tadarise",
            "tadarise",
            "megalis",
            "vilitra",
            "suhagra",
            "cialis",
            "tadacip",
            "tadaup",
        ],
    ),
    (
        "Anti_Biotic",
        [
            "amoxicillin",
            "amoxyclav",
            "azithro",
            "azithromycin",
            "cef",
            "cefix",
            "cefpodox",
            "ceftriax",
            "doxycycline",
            "levofloxacin",
            "moxifloxacin",
            "roxithromycin",
            "tetracycline",
            "linezolid",
            "nitazoxanide",
            "piperacillin",
            "tazobactam",
            "clindamycin",
            "ciplox",
        ],
    ),
    (
        "Anti_Malarial",
        [
            "artesunate",
            "artemether",
            "artemisinin",
            "lumefantrine",
            "hydroxychloroquine",
            "hcqs",
            "norsunate",
        ],
    ),
    (
        "Anti_Viral",
        [
            "oseltamivir",
            "valacyclovir",
            "ganciclovir",
            "molnupiravir",
            "sofosbuvir",
            "velpatasvir",
            "ledipasvir",
        ],
    ),
    (
        "Hormones_And_Steroids",
        [
            "testosterone",
            "nandrolone",
            "mesterolone",
            "clomiphene",
            "estradiol",
            "progesterone",
            "medroxyprogesterone",
            "dienogest",
        ],
    ),
    (
        "Injections",
        [
            " injection",
            " inj ",
            "ampoule",
        ],
    ),
    (
        "Skin_Allergy_Asthma",
        [
            "hydroquinone",
            "retino",
            "tretin",
            "tacrolimus",
            "eukroma",
            "panderm",
            "travatan",
            "tropicamide",
            "eye drop",
            "nasal spray",
        ],
    ),
    (
        "Supplements_Vitamins_Hair",
        [
            "vitamin",
            "biotin",
            "minoxidil",
            "hair",
            "keraboost",
            "curlzvit",
            "redenser",
        ],
    ),
    (
        "Anti_Cancer",
        [
            "tamoxifen",
            "thalidomide",
            "sorafenib",
            "lenv",
            "rolimus",
            "iressa",
            "abirat",
        ],
    ),
    (
        "Chronic_Cardiac",
        [
            "rosuvastatin",
            "metoprolol",
            "warfarin",
        ],
    ),
]
UNCLEAR_CATEGORY = "Unclear"

ALL_CATEGORY_NAMES = [name for name, _ in CATEGORY_KEYWORDS] + [UNCLEAR_CATEGORY]


def detect_category(folder_name: str) -> str:
    """Return best category name for a given folder by keyword matching.
    First match wins (priority based on CATEGORY_KEYWORDS order).
    """
    low = folder_name.lower()
    for cat, keywords in CATEGORY_KEYWORDS:
        for kw in keywords:
            if kw in low:
                return cat
    return UNCLEAR_CATEGORY


def ensure_category_dirs(base_dir: str) -> None:
    for cat in ALL_CATEGORY_NAMES:
        path = os.path.join(base_dir, cat)
        if not os.path.isdir(path):
            os.makedirs(path, exist_ok=True)


def is_already_categorized(path: str, base_dir: str, category: str) -> bool:
    """Check if the item is already inside base_dir/<category>/item."""
    # If parent directory name equals category, consider it already categorized
    parent = os.path.basename(os.path.dirname(path))
    return parent == category


def main() -> None:
    parser = argparse.ArgumentParser(description="Categorize medicine folders inside final_web.")
    parser.add_argument("--base-dir", default=os.path.join(os.getcwd(), "final_web"), help="Path to final_web base directory")
    parser.add_argument("--dry-run", action="store_true", help="Preview actions without moving folders")
    parser.add_argument(
        "--reclassify",
        action="store_true",
        help="Also scan inside existing category folders (including 'Unclear') and move items to a better-matched category.",
    )
    args = parser.parse_args()

    base_dir = args.base_dir
    dry_run = args.dry_run
    do_reclassify = args.reclassify

    if not os.path.isdir(base_dir):
        print(f"ERROR: Base directory not found: {base_dir}")
        return

    print(f"Scanning base directory: {base_dir}")

    ensure_category_dirs(base_dir)

    categorized = 0
    moved = 0
    skipped = 0
    conflicts = 0
    unclear = 0

    try:
        entries = sorted(os.listdir(base_dir))
    except Exception as e:
        print(f"ERROR: Unable to list directory '{base_dir}': {e}")
        return

    # Process only immediate subdirectories that are not category names
    for name in entries:
        src_path = os.path.join(base_dir, name)
        if not os.path.isdir(src_path):
            continue  # ignore files
        if name in ALL_CATEGORY_NAMES:
            # Skip category folders themselves
            continue

        category = detect_category(name)
        if category == UNCLEAR_CATEGORY:
            unclear += 1
            categorized += 1
            # Still create a destination within Unclear
            dest_dir = os.path.join(base_dir, UNCLEAR_CATEGORY)
        else:
            dest_dir = os.path.join(base_dir, category)
            categorized += 1

        # If already located inside dest_dir (if user points base_dir above categories), skip
        if is_already_categorized(src_path, base_dir, os.path.basename(dest_dir)):
            print(f"SKIP: '{name}' already in '{os.path.basename(dest_dir)}'")
            skipped += 1
            continue

        dest_path = os.path.join(dest_dir, name)
        if os.path.exists(dest_path):
            print(f"CONFLICT: Destination already exists: {dest_path} — skipping")
            conflicts += 1
            continue

        if dry_run:
            print(f"DRY-RUN MOVE: '{src_path}' -> '{dest_path}'")
        else:
            try:
                shutil.move(src_path, dest_dir)
                print(f"MOVED: '{name}' -> {os.path.basename(dest_dir)}")
                moved += 1
            except Exception as e:
                print(f"ERROR moving '{name}': {e}")
                conflicts += 1

    # Optional reclassification pass: scan existing category folders and move items if they match a different category
    reclassified = 0
    if do_reclassify:
        for current_category in ALL_CATEGORY_NAMES:
            current_dir = os.path.join(base_dir, current_category)
            if not os.path.isdir(current_dir):
                continue
            try:
                sub_entries = sorted(os.listdir(current_dir))
            except Exception as e:
                print(f"ERROR: Unable to list '{current_dir}': {e}")
                conflicts += 1
                continue

            for name in sub_entries:
                src_path = os.path.join(current_dir, name)
                if not os.path.isdir(src_path):
                    continue

                new_category = detect_category(name)
                if new_category == current_category:
                    continue  # already in best category

                dest_dir = os.path.join(base_dir, new_category)
                if not os.path.isdir(dest_dir):
                    os.makedirs(dest_dir, exist_ok=True)

                dest_path = os.path.join(dest_dir, name)
                if os.path.exists(dest_path):
                    print(f"RECLASS CONFLICT: Destination exists: {dest_path} — skipping")
                    conflicts += 1
                    continue

                if dry_run:
                    print(f"RECLASS DRY-RUN MOVE: '{src_path}' -> '{dest_path}'")
                else:
                    try:
                        shutil.move(src_path, dest_dir)
                        print(
                            f"RECLASS MOVED: '{name}' from {current_category} -> {new_category}"
                        )
                        moved += 1
                        reclassified += 1
                    except Exception as e:
                        print(f"ERROR reclassifying '{name}': {e}")
                        conflicts += 1

    print("\nSummary:")
    print(f"  Total categorized: {categorized}")
    print(f"  Moved: {moved}")
    print(f"  Skipped (already correct): {skipped}")
    print(f"  Conflicts/Errors: {conflicts}")
    print(f"  Unclear (placed into '{UNCLEAR_CATEGORY}'): {unclear}")
    if do_reclassify:
        print(f"  Reclassified (moved between categories): {reclassified}")
    if dry_run:
        print("\nNote: This was a dry run. Re-run without --dry-run to apply changes.")


if __name__ == "__main__":
    main()
