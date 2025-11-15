"""
Merge medicines from both final_web and final_web_2 folders into a single medicines directory.

This script:
1. Creates a unified 'medicines' directory
2. Merges medicines from both source directories
3. Handles duplicate categories by combining them
4. Handles duplicate medicine names by adding suffixes
5. Maintains proper categorization

Usage (PowerShell):
  # Dry run to see what will be merged
  python .\scripts\merge_medicines.py --dry-run

  # Actual merge
  python .\scripts\merge_medicines.py
"""
from __future__ import annotations
import os
import shutil
import argparse
from typing import Dict, List, Set

def get_all_categories(base_dirs: List[str]) -> Set[str]:
    """Get all unique categories from both source directories."""
    categories = set()
    for base_dir in base_dirs:
        if os.path.isdir(base_dir):
            try:
                entries = os.listdir(base_dir)
                for entry in entries:
                    entry_path = os.path.join(base_dir, entry)
                    if os.path.isdir(entry_path):
                        categories.add(entry)
            except Exception as e:
                print(f"ERROR: Cannot list directory '{base_dir}': {e}")
    return categories

def ensure_category_dirs(medicines_dir: str, categories: Set[str]) -> None:
    """Create all category directories in the medicines folder."""
    for category in categories:
        cat_path = os.path.join(medicines_dir, category)
        if not os.path.isdir(cat_path):
            os.makedirs(cat_path, exist_ok=True)

def get_unique_name(dest_dir: str, medicine_name: str) -> str:
    """Get a unique name for the medicine folder if it already exists."""
    original_name = medicine_name
    counter = 1
    dest_path = os.path.join(dest_dir, medicine_name)
    
    while os.path.exists(dest_path):
        medicine_name = f"{original_name}_v{counter}"
        dest_path = os.path.join(dest_dir, medicine_name)
        counter += 1
    
    return medicine_name

def merge_medicines(source_dirs: List[str], medicines_dir: str, dry_run: bool = False) -> Dict[str, int]:
    """Merge medicines from source directories into the medicines directory."""
    stats = {
        'total_processed': 0,
        'total_moved': 0,
        'duplicates_renamed': 0,
        'skipped': 0,
        'errors': 0
    }
    
    # Get all categories first
    all_categories = get_all_categories(source_dirs)
    print(f"Found categories: {', '.join(sorted(all_categories))}")
    
    if not dry_run:
        ensure_category_dirs(medicines_dir, all_categories)
    
    for source_idx, source_dir in enumerate(source_dirs):
        source_name = f"final_web{'_2' if source_idx == 1 else ''}"
        if not os.path.isdir(source_dir):
            print(f"WARNING: Source directory not found: {source_dir}")
            continue
            
        print(f"\nProcessing {source_name}: {source_dir}")
        
        try:
            categories = sorted(os.listdir(source_dir))
        except Exception as e:
            print(f"ERROR: Cannot list source directory: {e}")
            stats['errors'] += 1
            continue
            
        for category in categories:
            cat_path = os.path.join(source_dir, category)
            if not os.path.isdir(cat_path):
                continue
                
            dest_cat_dir = os.path.join(medicines_dir, category)
            
            try:
                medicines = sorted(os.listdir(cat_path))
            except Exception as e:
                print(f"ERROR: Cannot list category '{category}': {e}")
                stats['errors'] += 1
                continue
                
            for medicine in medicines:
                medicine_path = os.path.join(cat_path, medicine)
                if not os.path.isdir(medicine_path):
                    continue
                    
                stats['total_processed'] += 1
                
                # Check if destination already exists and get unique name
                unique_name = get_unique_name(dest_cat_dir, medicine)
                dest_path = os.path.join(dest_cat_dir, unique_name)
                
                if unique_name != medicine:
                    stats['duplicates_renamed'] += 1
                    print(f"  RENAMED: '{medicine}' -> '{unique_name}' (duplicate)")
                
                if dry_run:
                    print(f"  DRY-RUN MOVE: {source_name}/{category}/{medicine} -> medicines/{category}/{unique_name}")
                else:
                    try:
                        shutil.move(medicine_path, dest_path)
                        print(f"  MOVED: {source_name}/{category}/{medicine} -> medicines/{category}/{unique_name}")
                        stats['total_moved'] += 1
                    except Exception as e:
                        print(f"  ERROR moving '{medicine}': {e}")
                        stats['errors'] += 1
    
    return stats

def main() -> None:
    parser = argparse.ArgumentParser(description="Merge medicines from final_web and final_web_2 into a single medicines directory.")
    parser.add_argument("--medicines-dir", default="medicines", help="Name of the unified medicines directory")
    parser.add_argument("--dry-run", action="store_true", help="Preview actions without moving folders")
    
    args = parser.parse_args()
    
    medicines_dir = os.path.join(os.getcwd(), args.medicines_dir)
    dry_run = args.dry_run
    
    # Define source directories
    source_dirs = [
        os.path.join(os.getcwd(), "final_web"),
        os.path.join(os.getcwd(), "final_web_2", "final_web_2")
    ]
    
    print(f"Merging medicines into: {medicines_dir}")
    print(f"Source directories:")
    for i, src in enumerate(source_dirs):
        exists = "✓" if os.path.isdir(src) else "✗"
        print(f"  {exists} {src}")
    
    if not dry_run:
        os.makedirs(medicines_dir, exist_ok=True)
    
    # Merge medicines from both directories
    stats = merge_medicines(source_dirs, medicines_dir, dry_run)
    
    print(f"\nMerge Summary:")
    print(f"  Total medicines processed: {stats['total_processed']}")
    print(f"  Successfully moved: {stats['total_moved']}")
    print(f"  Duplicates renamed: {stats['duplicates_renamed']}")
    print(f"  Errors: {stats['errors']}")
    
    if dry_run:
        print("\nNote: This was a dry run. Re-run without --dry-run to apply changes.")
    else:
        print(f"\nMedicines successfully merged into: {medicines_dir}")

if __name__ == "__main__":
    main()