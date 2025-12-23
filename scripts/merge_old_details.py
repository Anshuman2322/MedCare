import json
import sys
from pathlib import Path
import argparse
import re

CURRENT_PATH = Path(r"S:\MedCare\src\data\medicines.json")
PREV_PATH = Path(r"S:\MedCare\src\data\medicines.previous.json")
PREV2_PATH = Path(r"S:\MedCare\src\data\medicines.previous2.json")

# Labels to prefer restoring when missing
PREFER_LABELS = {
    "dosage",
    "usage",
    "composition",
    "strength",
    "packSize",
    "packagingType",
    "tabletsInStrip",
    "shelfLife",
    "medicineType",
    "storage",
}

# Details labels order (to normalize)
DETAIL_LABELS = [
    "Brand Name",
    "Manufacturer",
    "Strength",
    "Composition",
    "Form",
    "Pack Size",
    "Packaging Type",
    "Tablets in a Strip",
    "Shelf Life",
    "Category",
    "Medicine Type",
    "Storage",
]

def load_json(path: Path):
    if not path.exists():
        return []
    # Try multiple encodings to handle files from git or different editors
    for enc in ("utf-8", "utf-8-sig", "utf-16", "utf-16-le", "utf-16-be"):
        try:
            with path.open("r", encoding=enc) as f:
                return json.load(f)
        except Exception:
            continue
    raise RuntimeError(f"Failed to read JSON file: {path}")


def normalize_details(entry, incoming):
    by_label = {str(row.get("label")): {"label": str(row.get("label")), "value": str(row.get("value", ""))}
                for row in incoming or [] if row and row.get("label")}
    defaults = {
        "Brand Name": entry.get("name", ""),
        "Manufacturer": entry.get("manufacturer", ""),
        "Strength": entry.get("strength", ""),
        "Composition": entry.get("composition", ""),
        "Form": entry.get("form", ""),
        "Pack Size": entry.get("packSize", ""),
        "Packaging Type": entry.get("packagingType", ""),
        "Tablets in a Strip": entry.get("tabletsInStrip", ""),
        "Shelf Life": entry.get("shelfLife", ""),
        "Category": entry.get("category", ""),
        "Medicine Type": entry.get("medicineType", ""),
        "Storage": entry.get("storage", ""),
    }
    result = []
    for label in DETAIL_LABELS:
        cur = by_label.pop(label, None)
        cur_val = (cur or {}).get("value", "")
        use_val = cur_val if str(cur_val).strip() else defaults.get(label, "")
        result.append({"label": label, "value": use_val})
    # Append leftover custom labels
    for leftover in by_label.values():
        result.append(leftover)
    return result

def merge_details_with_old(entry, current, old):
    # Build maps for quick lookup
    cur_map = {str(r.get("label")): str(r.get("value", "")) for r in (current or []) if r and r.get("label")}
    old_map = {str(r.get("label")): str(r.get("value", "")) for r in (old or []) if r and r.get("label")}
    merged = []
    defaults = {
        "Brand Name": entry.get("name", ""),
        "Manufacturer": entry.get("manufacturer", ""),
        "Strength": entry.get("strength", ""),
        "Composition": entry.get("composition", ""),
        "Form": entry.get("form", ""),
        "Pack Size": entry.get("packSize", ""),
        "Packaging Type": entry.get("packagingType", ""),
        "Tablets in a Strip": entry.get("tabletsInStrip", ""),
        "Shelf Life": entry.get("shelfLife", ""),
        "Category": entry.get("category", ""),
        "Medicine Type": entry.get("medicineType", ""),
        "Storage": entry.get("storage", ""),
    }
    for label in DETAIL_LABELS:
        cur_v = cur_map.get(label, "")
        old_v = old_map.get(label, "")
        val = old_v if str(old_v).strip() else (cur_v if str(cur_v).strip() else defaults.get(label, ""))
        merged.append({"label": label, "value": val})
    # Append any custom labels from current or old that aren't in the default list
    seen = set(DETAIL_LABELS)
    for source in (current or []):
        lab = str(source.get("label"))
        if lab and lab not in seen:
            merged.append({"label": lab, "value": str(source.get("value", ""))})
            seen.add(lab)
    for source in (old or []):
        lab = str(source.get("label"))
        if lab and lab not in seen:
            merged.append({"label": lab, "value": str(source.get("value", ""))})
            seen.add(lab)
    return merged


def main():
    parser = argparse.ArgumentParser(description="Merge old details into current medicines.json")
    parser.add_argument("--extra", dest="extra", nargs="*", default=[], help="Additional previous JSON file(s) to merge from")
    args = parser.parse_args()

    cur = load_json(CURRENT_PATH)
    prev = load_json(PREV_PATH)
    prev2 = load_json(PREV2_PATH)
    combined_prev = []
    combined_prev.extend([e for e in prev if isinstance(e, dict)])
    combined_prev.extend([e for e in prev2 if isinstance(e, dict)])
    # Load any extra previous files supplied
    for p in args.extra:
        try:
            data = load_json(Path(p))
            combined_prev.extend([e for e in data if isinstance(e, dict)])
        except Exception:
            pass
    prev_by_id = {str(e.get("id")): e for e in combined_prev if e.get("id")}

    # Helper to slugify names similar to frontend/backend
    def slug(s: str) -> str:
        s = str(s or "").strip().lower().replace("&", " and ")
        out = []
        prev_dash = False
        for ch in s:
            if ch.isalnum():
                out.append(ch)
                prev_dash = False
            else:
                if not prev_dash:
                    out.append('-')
                    prev_dash = True
        res = ''.join(out).strip('-')
        return res

    prev_by_name = {}
    for e in combined_prev:
        if not isinstance(e, dict):
            continue
        nm = e.get("name")
        if nm:
            prev_by_name.setdefault(slug(nm), e)
        # Try details Brand Name
        d = e.get("details")
        if isinstance(d, list):
            for row in d:
                if isinstance(row, dict) and str(row.get("label")).lower() == "brand name":
                    bn = row.get("value")
                    if bn:
                        prev_by_name.setdefault(slug(bn), e)
                    break

    # Build token index for fuzzy matching when id/name differ (e.g., brand vs generic)
    STOPWORDS = {"tablet", "tablets", "capsule", "capsules", "mg", "ml", "g", "tab", "tabs"}
    WORD_RE = re.compile(r"[a-z0-9]+")

    def tokens(s: str):
        words = [w for w in WORD_RE.findall(str(s or '').lower()) if w and w not in STOPWORDS]
        return set(words)

    prev_token_index = []
    for e in combined_prev:
        nm = str(e.get("name", ""))
        toks = tokens(nm)
        # include Brand Name from details
        d = e.get("details")
        if isinstance(d, list):
            for row in d:
                if str(row.get("label", "")).lower() == "brand name":
                    toks |= tokens(row.get("value", ""))
                    break
        prev_token_index.append((toks, e))

    updated = []
    restored_count = 0

    for entry in cur:
        old = prev_by_id.get(entry.get("id"))
        if not old:
            old = prev_by_name.get(slug(entry.get("name")))
        # If still not found, try fuzzy match by tokens overlap
        if not old:
            etoks = tokens(entry.get("name"))
            best = None
            best_score = 0.0
            for ptoks, cand in prev_token_index:
                if not ptoks:
                    continue
                inter = len(etoks & ptoks)
                if inter == 0:
                    continue
                denom = len(etoks | ptoks)
                score = inter / denom if denom else 0.0
                # Require reasonable overlap
                if score > best_score and score >= 0.5:
                    best = cand
                    best_score = score
            if best is not None:
                old = best
        if old:
            # Restore simple fields if missing or empty
            for k in PREFER_LABELS:
                if not str(entry.get(k, "")).strip() and str(old.get(k, "")).strip():
                    entry[k] = old[k]
            # Merge details, preferring old values when available
            old_details = old.get("details")
            entry["details"] = merge_details_with_old(entry, entry.get("details"), old_details)
            restored_count += 1 if isinstance(old_details, list) and len(old_details) > 0 else 0
        # Ensure normalization pass (labels ordering and default fill)
        entry["details"] = normalize_details(entry, entry.get("details"))
        updated.append(entry)

    with CURRENT_PATH.open("w", encoding="utf-8") as f:
        json.dump(updated, f, indent=2, ensure_ascii=False)

    print(f"Restored details for {restored_count} medicines. Total entries: {len(updated)}")


if __name__ == "__main__":
    main()
