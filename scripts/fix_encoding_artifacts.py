import json
import re
import argparse
from pathlib import Path

DATA_PATH = Path(r"S:\MedCare\src\data\medicines.json")

# Patterns for normalization
EN_DASH_MOJIBAKE = "ΓÇô"  # replace with proper en dash
NARROW_NBSP_MOJIBAKE = "ΓÇë"  # replace with normal space
DEGREE_MOJIBAKE = "┬░"  # replace with degree symbol

# Additional common mojibake sequences
MOJIBAKE_MAP = {
    # Dashes
    "â€“": "–",
    "â€”": "—",
    EN_DASH_MOJIBAKE: "–",
    # Quotes/apostrophes
    "â€˜": "‘",
    "â€™": "’",
    "â€œ": "“",
    "â€�": "”",
    "ΓÇ£": "“",
    "ΓÇ¥": "”",
    "ΓÇÖ": "’",
    # Em dash variant
    "ΓÇö": "—",
    # Spaces
    NARROW_NBSP_MOJIBAKE: " ",
    "â€¯": " ",
    # Degree and temperature
    DEGREE_MOJIBAKE: "°",
    "Â°": "°",
    # Superscript two (square meter)
    "┬▓": "²",
    # Multiplication/cross
    "Ã—": "×",
    "├ù": "×",
    # Ellipsis, bullet, trademark, copyright, registered
    "â€¦": "…",
    "â€¢": "•",
    "â„¢": "™",
    "Â©": "©",
    "Â®": "®",
}

def normalize_text(s: str) -> str:
    if not isinstance(s, str):
        return s
    t = s
    # Fix common mojibake artifacts
    for bad, good in MOJIBAKE_MAP.items():
        if bad in t:
            t = t.replace(bad, good)
    # Remove stray 'Â' when followed by a space
    t = re.sub(r"Â\s", " ", t)
    # Normalize month/day ranges to plural
    # e.g., 6–12 month -> 6–12 months; also accept hyphen '-'
    t = re.sub(r"(\b\d+)\s*[–-]\s*(\d+)\s*month\b", r"\1–\2 months", t, flags=re.IGNORECASE)
    t = re.sub(r"(\b\d+)\s*[–-]\s*(\d+)\s*day\b", r"\1–\2 days", t, flags=re.IGNORECASE)
    # Standardize casing to lowercase for units within sentences, except in detail values kept as-is
    # For ranges we already convert; now normalize capitalized Months/Days following numbers
    t = re.sub(r"(\b\d+\s*[–-]\s*\d+\s*)Months\b", r"\1months", t)
    t = re.sub(r"(\b\d+\s*[–-]\s*\d+\s*)Days\b", r"\1days", t)
    return t


def normalize_entry(obj):
    # Recursively normalize all strings in dict/list
    if isinstance(obj, dict):
        return {k: normalize_entry(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [normalize_entry(v) for v in obj]
    if isinstance(obj, str):
        return normalize_text(obj)
    return obj


def main():
    parser = argparse.ArgumentParser(description="Normalize encoding artifacts in a JSON dataset")
    parser.add_argument("--path", type=str, default=str(DATA_PATH), help="Path to JSON file to normalize")
    args = parser.parse_args()

    target_path = Path(args.path)
    # Robust load with encoding fallbacks
    encodings = ["utf-8", "utf-8-sig", "utf-16", "utf-16-le", "utf-16-be"]
    last_err = None
    for enc in encodings:
        try:
            with target_path.open("r", encoding=enc) as f:
                data = json.load(f)
            last_err = None
            break
        except Exception as e:
            last_err = e
            data = None
    if data is None:
        raise RuntimeError(f"Failed to load JSON {target_path} due to encoding: {last_err}")
    before = json.dumps(data, ensure_ascii=False)
    data_norm = [normalize_entry(e) for e in data]
    after = json.dumps(data_norm, ensure_ascii=False)
    if before != after:
        with target_path.open("w", encoding="utf-8") as f:
            json.dump(data_norm, f, indent=2, ensure_ascii=False)
        print(f"Normalized encoding artifacts in {target_path.name}. Updated {len(data_norm)} entries.")
    else:
        print(f"No changes needed for {target_path.name}.")


if __name__ == "__main__":
    main()
