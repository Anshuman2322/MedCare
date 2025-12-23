import re
import json
from pathlib import Path

DATA_PATH = Path(r"S:\MedCare\src\data\medicines.json")

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

DOSAGE_PATTERN = re.compile(r"(\d+(?:\.\d+)?)\s*(mg|ml|g)\b", re.IGNORECASE)

# Simple active ingredient heuristics by category
ACTIVE_KEYWORDS = [
    # ED
    "sildenafil", "tadalafil", "vardenafil", "avanafil", "dapoxetine",
    # Antibiotics / antiparasitic
    "azithromycin", "amoxicillin", "cefadroxil", "cefixime", "cefpodoxime", "ceftriaxone",
    "doxycycline", "levofloxacin", "moxifloxacin", "roxithromycin", "clindamycin",
    "ivermectin", "mebendazole", "triclabendazole", "nitazoxanide", "piperacillin", "tazobactam",
    # Antiviral
    "oseltamivir", "valacyclovir", "molnupiravir", "sofosbuvir", "ledipasvir", "daclatasvir", "velpatasvir", "ganciclovir",
    # Hormones & Steroids
    "testosterone", "progesterone", "anastrozole", "nandrolone", "methandienone", "minoxidil", "estradiol", "cyproterone",
    "dienogest", "mesterolone", "enclomiphene", "clomiphene",
    # Anti-malarial
    "artemether", "lumefantrine", "artesunate", "hydroxychloroquine",
    # Pain Relief
    "naproxen", "carisoprodol", "amitriptyline", "paracetamol",
]

def load_json(path: Path):
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)

def save_json(path: Path, data):
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def infer_strength(entry):
    # Prefer explicit strength field
    s = str(entry.get("strength", "")).strip()
    if s:
        return s
    # Try parsing from display name
    name = str(entry.get("name", ""))
    m = DOSAGE_PATTERN.search(name)
    if m:
        return f"{m.group(1)} {m.group(2).lower()}"
    return ""


def infer_actives(entry):
    name = str(entry.get("name", "")).lower()
    hits = []
    for kw in ACTIVE_KEYWORDS:
        if kw in name:
            hits.append(kw)
    # Keep unique order of appearance
    seen = set()
    out = []
    for kw in hits:
        if kw not in seen:
            seen.add(kw)
            out.append(kw)
    return out[:2]  # limit to two actives for readability


def infer_composition(entry):
    strength = infer_strength(entry)
    actives = infer_actives(entry)
    if actives:
        # Title-case actives and join
        actives_fmt = " + ".join(a.capitalize() for a in actives)
        return f"{actives_fmt}{(' ' + strength) if strength else ''}".strip()
    # Fallback to existing composition if present
    comp = str(entry.get("composition", "")).strip()
    return comp


def infer_packaging_type(pack_size_text: str, form_text: str):
    ps = (pack_size_text or "").lower()
    form = (form_text or "").lower()
    # Direct indications
    if "bottle" in ps or any(k in form for k in ["syrup", "solution", "suspension"]):
        return "Bottle"
    if "vial" in ps or "injection" in form:
        return "Vial"
    if "ampoule" in ps:
        return "Ampoule"
    if "sachet" in ps:
        return "Sachet"
    if "strip" in ps or "tablet" in ps or "capsule" in ps:
        return "Blister Pack"
    return ""


def infer_tablets_in_strip(pack_size_text: str):
    ps = (pack_size_text or "").lower()
    # Normalize common separators/mis-encodings
    ps = ps.replace("×", "x").replace("├ù", "x")
    # Patterns like 10 x 10 Tablets => use second number
    m = re.search(r"(\d+)\s*[x*]\s*(\d+)\s*(?:tablet|capsule)s?", ps)
    if m:
        return m.group(2)
    # Patterns like Strip of 10 tablets
    m2 = re.search(r"strip\s*of\s*(\d+)\s*(?:tablet|capsule)s?", ps)
    if m2:
        return m2.group(1)
    return ""


def normalize_details(entry):
    # Build maps from existing details
    cur = entry.get("details") or []
    by_label = {str(r.get("label")): str(r.get("value", "")) for r in cur if r and r.get("label")}
    pack_size_text = by_label.get("Pack Size") or str(entry.get("packSize", ""))
    form_text = by_label.get("Form") or str(entry.get("form", ""))
    derived_packaging_type = infer_packaging_type(pack_size_text, form_text)
    derived_tablets_in_strip = infer_tablets_in_strip(pack_size_text)
    defaults = {
        "Brand Name": entry.get("name", ""),
        "Manufacturer": entry.get("manufacturer", ""),
        "Strength": infer_strength(entry),
        "Composition": infer_composition(entry),
        "Form": entry.get("form", ""),
        "Pack Size": entry.get("packSize", ""),
        "Packaging Type": derived_packaging_type or entry.get("packagingType", ""),
        "Tablets in a Strip": derived_tablets_in_strip or entry.get("tabletsInStrip", ""),
        "Shelf Life": entry.get("shelfLife", ""),
        "Category": entry.get("category", ""),
        "Medicine Type": entry.get("medicineType", "Allopathic"),
        "Storage": entry.get("storage", "Store below 25°C, protect from light"),
    }
    merged = []
    for label in DETAIL_LABELS:
        cur_v = by_label.get(label, "")
        use_v = cur_v if str(cur_v).strip() else defaults.get(label, "")
        merged.append({"label": label, "value": use_v})
    # Append any custom labels not in the defaults
    seen = set(DETAIL_LABELS)
    for row in cur:
        lab = str(row.get("label"))
        if lab and lab not in seen:
            merged.append({"label": lab, "value": str(row.get("value", ""))})
            seen.add(lab)
    entry["details"] = merged


def main():
    data = load_json(DATA_PATH)
    updated = 0
    for e in data:
        before = json.dumps(e.get("details") or [], ensure_ascii=False)
        normalize_details(e)
        after = json.dumps(e.get("details") or [], ensure_ascii=False)
        if before != after:
            updated += 1
    save_json(DATA_PATH, data)
    print(f"Auto-filled details for {updated} medicines. Total: {len(data)}")

if __name__ == "__main__":
    main()
