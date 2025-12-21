import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const CATEGORIES_JSON_PATH = path.resolve(ROOT, "src", "data", "categories.json");

export const DEFAULT_CATEGORIES = [
  "Antibiotics",
  "Anti-Cancer",
  "Anti-Malarial",
  "Anti-Viral",
  "Chronic-Cardiac",
  "ED",
  "Hormones-Steroids",
  "Injections",
  "Pain-Killers",
  "Skin-Allergy-Asthma",
  "Supplements-Vitamins-Hair",
];

async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true });
}

export async function readCategories() {
  try {
    const raw = await fsp.readFile(CATEGORIES_JSON_PATH, "utf-8");
    const arr = JSON.parse(raw);
    const items = Array.isArray(arr) ? arr : DEFAULT_CATEGORIES.slice();
    // Coerce to string labels and dedupe
    const toLabel = (c) => {
      const s = typeof c === 'string' ? c : (c?.label ?? c?.name ?? '');
      return String(s).trim();
    };
    const set = new Set(items.map(toLabel).filter(Boolean));
    return Array.from(set);
  } catch {
    await ensureDir(path.dirname(CATEGORIES_JSON_PATH));
    await fsp.writeFile(CATEGORIES_JSON_PATH, JSON.stringify(DEFAULT_CATEGORIES, null, 2), "utf-8");
    return DEFAULT_CATEGORIES.slice();
  }
}

async function writeCategories(arr) {
  // Persist as sorted unique string labels
  const items = Array.isArray(arr) ? arr : [];
  const set = new Set(items.map((c) => String(c).trim()).filter(Boolean));
  const sorted = Array.from(set).sort();
  await fsp.writeFile(CATEGORIES_JSON_PATH, JSON.stringify(sorted, null, 2), "utf-8");
}

export async function getAllowedCategories() {
  const base = await readCategories();
  // Union with categories found in medicines.json so admin doesn't miss any
  try {
    const medsPath = path.resolve(ROOT, "src", "data", "medicines.json");
    const raw = await fsp.readFile(medsPath, "utf-8");
    const meds = JSON.parse(raw);
    const set = new Set(base);
    const LEGACY_CATEGORY_MAP = new Map([
      ["Anti Cancer", "Anti-Cancer"],
      ["Anti Malarial", "Anti-Malarial"],
      ["Anti Viral", "Anti-Viral"],
      ["Chronic / Cardiac", "Chronic-Cardiac"],
      ["Erectile Dysfunction", "ED"],
      ["Hormones & Steroids", "Hormones-Steroids"],
      ["Pain Relief", "Pain-Killers"],
      ["Skin / Allergy / Asthma", "Skin-Allergy-Asthma"],
      ["Supplements & Hair", "Supplements-Vitamins-Hair"],
    ]);
    const normalize = (c) => LEGACY_CATEGORY_MAP.get(c) || c;
    for (const m of Array.isArray(meds) ? meds : []) {
      const cats = Array.isArray(m.categories) && m.categories.length ? m.categories : [m.category];
      for (const rawLabel of cats) {
        const s = String(rawLabel ?? '').trim();
        if (!s) continue;
        const c = normalize(s);
        set.add(c);
      }
    }
    return Array.from(set).sort();
  } catch {
    return base.sort();
  }
}

export async function listCategories(_req, res) {
  const categories = await getAllowedCategories();
  res.json({ categories });
}

export async function createCategory(req, res, next) {
  try {
    const { label } = req.body || {};
    const name = String(label || "").trim();
    if (!name) return res.status(400).json({ error: "label is required" });
    const list = await readCategories();
    if (list.includes(name)) return res.status(409).json({ error: "Category already exists" });
    list.push(name);
    await writeCategories(list);
    res.status(201).json({ categories: list });
  } catch (err) { next(err); }
}

export async function updateCategory(req, res, next) {
  try {
    const { oldLabel, newLabel } = req.body || {};
    const from = String(oldLabel || "").trim();
    const to = String(newLabel || "").trim();
    if (!from || !to) return res.status(400).json({ error: "oldLabel and newLabel are required" });
    const list = await readCategories();
    // Find index: exact match, case-insensitive, or legacy normalized
    let idx = list.indexOf(from);
    if (idx === -1) {
      const lower = list.map((l) => String(l).toLowerCase());
      const i2 = lower.indexOf(from.toLowerCase());
      if (i2 !== -1) idx = i2;
    }
    if (idx === -1) {
      const LEGACY_CATEGORY_MAP = new Map([
        ["Anti Cancer", "Anti-Cancer"],
        ["Anti Malarial", "Anti-Malarial"],
        ["Anti Viral", "Anti-Viral"],
        ["Chronic / Cardiac", "Chronic-Cardiac"],
        ["Erectile Dysfunction", "ED"],
        ["Hormones & Steroids", "Hormones-Steroids"],
        ["Pain Relief", "Pain-Killers"],
        ["Skin / Allergy / Asthma", "Skin-Allergy-Asthma"],
        ["Supplements & Hair", "Supplements-Vitamins-Hair"],
      ]);
      const normalized = LEGACY_CATEGORY_MAP.get(from) || from;
      idx = list.indexOf(normalized);
    }
    // If still not found, attempt a rename directly in medicines and ensure categories list includes the target
    let performedRenameInMeds = false;
    if (idx === -1) {
      try {
        const medsPath = path.resolve(ROOT, "src", "data", "medicines.json");
        const raw = await fsp.readFile(medsPath, "utf-8");
        const meds = JSON.parse(raw);
        const normalize = (s) => String(s || "").trim();
        const fromNorm = normalize(from);
        const toNorm = normalize(to);
        let changed = false;
        for (const m of Array.isArray(meds) ? meds : []) {
          if (normalize(m.category).toLowerCase() === fromNorm.toLowerCase()) { m.category = toNorm; changed = true; }
          if (Array.isArray(m.categories)) {
            const mapped = m.categories.map((c) => (normalize(c).toLowerCase() === fromNorm.toLowerCase() ? toNorm : c));
            if (JSON.stringify(mapped) !== JSON.stringify(m.categories)) { m.categories = mapped; changed = true; }
          }
        }
        if (changed) {
          await fsp.writeFile(medsPath, JSON.stringify(meds, null, 2), "utf-8");
          performedRenameInMeds = true;
        }
      } catch {}
      // Ensure categories list has the target label
      if (!list.includes(to)) list.push(to);
    } else {
      if (from !== to && list.includes(to)) return res.status(409).json({ error: "Target label already exists" });
      list[idx] = to;
      await writeCategories(list);
    }
    // When rename happened only in meds, also persist categories list
    if (performedRenameInMeds) await writeCategories(list);
    // Best-effort: update medicines entries to reflect rename
    try {
      const medsPath = path.resolve(ROOT, "src", "data", "medicines.json");
      const raw = await fsp.readFile(medsPath, "utf-8");
      const meds = JSON.parse(raw);
      let changed = false;
      for (const m of Array.isArray(meds) ? meds : []) {
        if (m.category === from) { m.category = to; changed = true; }
        if (Array.isArray(m.categories)) {
          const before = m.categories.slice();
          m.categories = m.categories.map((c) => (c === from ? to : c));
          if (JSON.stringify(before) !== JSON.stringify(m.categories)) changed = true;
        }
      }
      if (changed) await fsp.writeFile(medsPath, JSON.stringify(meds, null, 2), "utf-8");
    } catch {}
    res.json({ categories: list });
  } catch (err) { next(err); }
}

export async function deleteCategory(req, res, next) {
  try {
    const { label } = req.body || {};
    const name = String(label || "").trim();
    if (!name) return res.status(400).json({ error: "label is required" });
    const list = await readCategories();
    const idx = list.indexOf(name);
    if (idx === -1) return res.status(404).json({ error: "Category not found" });
    // Prevent deletion if in use
    try {
      const medsPath = path.resolve(ROOT, "src", "data", "medicines.json");
      const raw = await fsp.readFile(medsPath, "utf-8");
      const meds = JSON.parse(raw);
      const used = (Array.isArray(meds) ? meds : []).filter((m) => m.category === name || (Array.isArray(m.categories) && m.categories.includes(name))).length;
      if (used > 0) return res.status(409).json({ error: `Category in use by ${used} medicine(s). Rename instead.` });
    } catch {}
    const nextList = list.filter((c) => c !== name);
    await writeCategories(nextList);
    res.json({ categories: nextList });
  } catch (err) { next(err); }
}
