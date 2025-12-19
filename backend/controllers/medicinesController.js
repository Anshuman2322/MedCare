import fsp from 'node:fs/promises';
import path from 'node:path';
import mime from 'mime-types';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..', '..');

// Default to repo's src/data/medicines.json used by the main site
const ENV_DATA_JSON_PATH = process.env?.DATA_JSON_PATH ? String(process.env.DATA_JSON_PATH) : null;
const DATA_JSON_PATH = ENV_DATA_JSON_PATH
  ? path.resolve(ROOT, ENV_DATA_JSON_PATH)
  : path.resolve(ROOT, 'src', 'data', 'medicines.json');

const PUBLIC_MEDICINES_DIR = path.resolve(ROOT, 'public', 'medicines');

const ALLOWED_CATEGORIES = [
  'Antibiotics',
  'Anti-Cancer',
  'Anti-Malarial',
  'Anti-Viral',
  'Chronic-Cardiac',
  'ED',
  'Hormones-Steroids',
  'Injections',
  'Pain-Killers',
  'Skin-Allergy-Asthma',
  'Supplements-Vitamins-Hair'
];

const LEGACY_CATEGORY_MAP = new Map([
  ['Anti Cancer', 'Anti-Cancer'],
  ['Anti Malarial', 'Anti-Malarial'],
  ['Anti Viral', 'Anti-Viral'],
  ['Chronic / Cardiac', 'Chronic-Cardiac'],
  ['Erectile Dysfunction', 'ED'],
  ['Hormones & Steroids', 'Hormones-Steroids'],
  ['Pain Relief', 'Pain-Killers'],
  ['Skin / Allergy / Asthma', 'Skin-Allergy-Asthma'],
  ['Supplements & Hair', 'Supplements-Vitamins-Hair']
]);

const slug = (s) =>
  s.toString().trim().toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

const catSlug = (label) => slug(label);

async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true });
}

async function readJson() {
  try {
    const raw = await fsp.readFile(DATA_JSON_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    await ensureDir(path.dirname(DATA_JSON_PATH));
    await fsp.writeFile(DATA_JSON_PATH, '[]', 'utf-8');
    return [];
  }
}

async function writeJson(arr) {
  await fsp.writeFile(DATA_JSON_PATH, JSON.stringify(arr, null, 2), 'utf-8');
}
const PREDEFINED_DETAIL_LABELS = [
  'Brand Name',
  'Manufacturer',
  'Strength',
  'Composition',
  'Form',
  'Pack Size',
  'Packaging Type',
  'Tablets in a Strip',
  'Shelf Life',
  'Category',
  'Medicine Type',
  'Storage'
];

function mergePredefinedDetails(entry, incoming) {
  const byLabel = new Map();
  for (const row of Array.isArray(incoming) ? incoming : []) {
    if (!row || !row.label) continue;
    byLabel.set(String(row.label), { label: String(row.label), value: String(row.value ?? '') });
  }
  // Ensure standard rows exist, prefilling from entry scalars when possible
  const defaults = new Map([
    ['Brand Name', entry.name ?? ''],
    ['Manufacturer', entry.manufacturer ?? ''],
    ['Strength', ''],
    ['Composition', entry.composition ?? ''],
    ['Form', entry.form ?? ''],
    ['Pack Size', ''],
    ['Packaging Type', ''],
    ['Tablets in a Strip', ''],
    ['Shelf Life', ''],
    ['Category', entry.category ?? ''],
    ['Medicine Type', ''],
    ['Storage', '']
  ]);
  const result = [];
  for (const label of PREDEFINED_DETAIL_LABELS) {
    const current = byLabel.get(label);
    const value = current?.value ?? defaults.get(label) ?? '';
    result.push({ label, value });
    if (current) byLabel.delete(label);
  }
  // Append any custom rows that were provided
  for (const leftover of byLabel.values()) {
    if (leftover && leftover.label) result.push(leftover);
  }
  return result;
}

// Match current site: flat URLs /medicines/<id>/<n>.jpg
const USE_CATEGORY_IN_PATH = false;

function imageUrl(categoryLabel, id, fileName) {
  const normalized = LEGACY_CATEGORY_MAP.get(categoryLabel) || categoryLabel;
  const _cSlug = catSlug(normalized);
  if (USE_CATEGORY_IN_PATH) {
    return `/medicines/${_cSlug}/${id}/${fileName}`;
  }
  return `/medicines/${id}/${fileName}`;
}

function resolveDiskFolder(_categoryLabel, id) {
  // Flat on disk to match JSON URLs: /medicines/<id>/<n>.jpg
  return path.join(PUBLIC_MEDICINES_DIR, id);
}

async function nextImageNumber(dir) {
  try {
    const files = await fsp.readdir(dir);
    let max = 0;
    for (const f of files) {
      // Support both "1.jpg" and legacy names like "1unnamed.jpg"
      const m = /^(\d+)/.exec(f);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    }
    return max + 1;
  } catch {
    return 1;
  }
}

function validateCategory(label) {
  const normalized = LEGACY_CATEGORY_MAP.get(label) || label;
  if (!ALLOWED_CATEGORIES.includes(normalized)) {
    const err = new Error(`Invalid category. Allowed: ${ALLOWED_CATEGORIES.join(', ')}`);
    err.status = 400;
    throw err;
  }
  return normalized;
}

async function listImagesFromDisk(entry) {
  const dir = resolveDiskFolder(entry.category, entry.id);
  try {
    const files = await fsp.readdir(dir);
    // keep only images we know how to serve
    const images = files
      .filter((f) => /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(f))
      .sort((a, b) => {
        const na = parseInt(a, 10);
        const nb = parseInt(b, 10);
        if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
        return a.localeCompare(b);
      })
      .map((fileName) => imageUrl(entry.category, entry.id, fileName));
    return images;
  } catch {
    return [];
  }
}

export async function listCategories(_req, res) {
  res.json({ categories: ALLOWED_CATEGORIES });
}

export async function listMedicines(req, res) {
  const data = await readJson();
  const { deleted } = req.query || {};
  if (String(deleted) === 'true') {
    // Only return items that have deletedAt property and it's not null/undefined
    res.json(data.filter((m) => m.deletedAt != null));
  } else {
    // Only return items that don't have deletedAt or it's null/undefined
    res.json(data.filter((m) => m.deletedAt == null));
  }
}

export async function getMedicine(req, res, next) {
  try {
    const { id } = req.params;
    const data = await readJson();
    const item = data.find((m) => m.id === id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
}

export async function createMedicine(req, res, next) {
  try {
    const {
      name,
      category,
      price = 0,
      form = 'Tablet',
      description = '',
      manufacturer = 'Generic',
      composition = '',
      requiresPrescription = true,
      inStock = true,
      dosage = '',
      usage = '',
      details = ''
    } = req.body;

    if (!name) throw Object.assign(new Error('Name is required'), { status: 400 });

    let categories = [];
    try {
      categories = JSON.parse(req.body.categories || '[]');
      if (!Array.isArray(categories)) categories = [];
    } catch { categories = []; }
    const normalizedCategories = categories.map((c) => validateCategory(c));
    const primaryCategory = normalizedCategories[0] || validateCategory(category);
    const id = slug(name);

    const data = await readJson();
    if (data.some((m) => m.id === id)) {
      throw Object.assign(new Error('Duplicate medicine ID'), { status: 409 });
    }

    const dir = resolveDiskFolder(primaryCategory, id);
    await ensureDir(dir);

    // Move uploads, auto-number
    let n = await nextImageNumber(dir);
    const urls = [];
    for (const file of req.files || []) {
      const ext = (mime.extension(file.mimetype) || path.extname(file.originalname).slice(1) || 'jpg').toLowerCase();
      const safeExt = ext === 'jpeg' ? 'jpg' : ext;
      const finalName = `${n}.${safeExt}`;
      const dest = path.join(dir, finalName);
      await fsp.rename(file.path, dest);
      // Use the resolved primary category for image URL path
      urls.push(imageUrl(primaryCategory, id, finalName));
      n++;
    }

    // Normalize details to array of { label, value }
    let detailsArr = [];
    if (Array.isArray(details)) {
      detailsArr = details;
    } else if (typeof details === 'string' && details.trim()) {
      try { detailsArr = JSON.parse(details); } catch { detailsArr = []; }
    }

    let entry = {
      id,
      name,
      category: primaryCategory,
      categories: normalizedCategories,
      price: Number(price),
      form,
      image: urls[0] || '',
      images: urls,
      inStock: Boolean(inStock),
      description,
      manufacturer,
      composition,
      requiresPrescription: String(requiresPrescription) !== 'false',
      dosage,
      usage,
      details: detailsArr
    };

    // Normalize details to include predefined labels
    entry.details = mergePredefinedDetails(entry, entry.details);

    data.push(entry);
    await writeJson(data);
    res.status(201).json(entry);
  } catch (err) {
    if (req.files?.length) {
      await Promise.allSettled(req.files.map((f) => fsp.rm(f.path, { force: true })));
    }
    next(err);
  }
}

export async function updateMedicine(req, res, next) {
  try {
    const { id } = req.params;
    const data = await readJson();
    const idx = data.findIndex((m) => m.id === id);
    if (idx === -1) throw Object.assign(new Error('Not found'), { status: 404 });

    // Potential rename via name change
    const body = req.body || {};
    let targetId = data[idx].id;
    let targetCat = data[idx].category;
    let pendingCategories = null;

    if (body.name && slug(body.name) !== id) {
      const newId = slug(body.name);
      if (data.some((m) => m.id === newId)) {
        throw Object.assign(new Error('Target ID exists'), { status: 409 });
      }
      const oldDir = resolveDiskFolder(targetCat, id);
      const newDir = resolveDiskFolder(targetCat, newId);

      let renameOK = false;
      if (oldDir !== newDir) {
        await ensureDir(path.dirname(newDir));
        try {
          await fsp.access(oldDir);
          await fsp.rename(oldDir, newDir);
          renameOK = true;
        } catch (e1) {
          // Fallback: copy folder when rename fails (e.g., EPERM on Windows)
          try {
            await fsp.cp(oldDir, newDir, { recursive: true, force: true });
            renameOK = true;
            // Best-effort remove old dir (ignore errors)
            try { await fsp.rm(oldDir, { recursive: true, force: true }); } catch {}
          } catch (e2) {
            // If both rename and copy fail, do not proceed with id change
            const err = new Error(`Unable to rename images folder (in use?). Keep ID as '${id}'.`);
            err.status = 423; // Locked
            err.cause = e2 || e1;
            throw err;
          }
        }
      } else {
        renameOK = true;
      }

      if (renameOK) {
        targetId = newId;
      }
    }

    if (body.category || body.categories) {
      let nextCats = [];
      try { nextCats = JSON.parse(body.categories || '[]'); } catch { nextCats = []; }
      if (!Array.isArray(nextCats) || nextCats.length === 0) {
        const single = body.category ? validateCategory(body.category) : targetCat;
        nextCats = [single];
      } else {
        nextCats = nextCats.map((c) => validateCategory(c));
      }
      targetCat = nextCats[0] || targetCat;
      pendingCategories = nextCats;
    }

    const entry = data[idx];
    // Apply target id/category to entry now
    entry.id = targetId;
    entry.category = targetCat;
    if (pendingCategories) entry.categories = pendingCategories;
    const dir = resolveDiskFolder(entry.category, entry.id);
    await ensureDir(dir);

    // Append new images
    let n = await nextImageNumber(dir);
    if (!Array.isArray(entry.images)) entry.images = [];
    for (const file of req.files || []) {
      const ext = (mime.extension(file.mimetype) || path.extname(file.originalname).slice(1) || 'jpg').toLowerCase();
      const safeExt = ext === 'jpeg' ? 'jpg' : ext;
      const finalName = `${n}.${safeExt}`;
      const dest = path.join(dir, finalName);
      await fsp.rename(file.path, dest);
      entry.images.push(imageUrl(entry.category, entry.id, finalName));
      n++;
    }

    // Update scalars
    const scalars = ['name', 'price', 'form', 'description', 'manufacturer', 'composition', 'requiresPrescription', 'inStock', 'dosage', 'usage'];
    for (const k of scalars) {
      if (k in body) {
        if (k === 'price') entry[k] = Number(body[k]);
        else if (k === 'requiresPrescription' || k === 'inStock') entry[k] = String(body[k]) !== 'false';
        else entry[k] = body[k];
      }
    }

    if ('details' in body) {
      try {
        const parsed = typeof body.details === 'string' ? JSON.parse(body.details || '[]') : body.details;
        if (Array.isArray(parsed)) entry.details = parsed;
      } catch {}
    }

    // Ensure predefined details exist after any scalar/detail changes
    entry.details = mergePredefinedDetails(entry, entry.details);

    // If ID changed, rewrite image URLs only if the new folder actually has files
    if (targetId !== id) {
      const newDir = resolveDiskFolder(entry.category, entry.id);
      let hasFiles = false;
      try {
        const files = await fsp.readdir(newDir);
        hasFiles = Array.isArray(files) && files.length > 0;
      } catch {}
      if (hasFiles) {
        entry.images = (entry.images || []).map((u) => {
          const fileName = path.basename(u);
          return imageUrl(entry.category, entry.id, fileName);
        });
      }
    }

    // As a safety net, if images are empty or files missing, rebuild from disk
    const rebuilt = await listImagesFromDisk(entry);
    if (!entry.images?.length || rebuilt.length > 0) {
      entry.images = rebuilt.length ? rebuilt : entry.images;
    }

    entry.image = entry.images[0] || entry.image || '';
    await writeJson(data);
    res.json(entry);
  } catch (err) {
    if (req.files?.length) {
      await Promise.allSettled(req.files.map((f) => fsp.rm(f.path, { force: true })));
    }
    next(err);
  }
}

export async function deleteMedicine(req, res, next) {
  try {
    const { id } = req.params;
    const data = await readJson();
    const idx = data.findIndex((m) => m.id === id);
    if (idx === -1) throw Object.assign(new Error('Not found'), { status: 404 });

    // Soft delete: mark deletedAt; keep images for 7 days
    const now = new Date().toISOString();
    data[idx].deletedAt = now;
    await writeJson(data);
    res.json({ ok: true, deletedAt: now });
  } catch (err) {
    next(err);
  }
}

export async function restoreMedicine(req, res, next) {
  try {
    const { id } = req.params;
    const data = await readJson();
    const idx = data.findIndex((m) => m.id === id);
    if (idx === -1) throw Object.assign(new Error('Not found'), { status: 404 });
    data[idx].deletedAt = undefined;
    await writeJson(data);
    res.json(data[idx]);
  } catch (err) {
    next(err);
  }
}

export async function purgeDeleted(req, res, next) {
  try {
    const data = await readJson();
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const keep = [];
    const removed = [];
    for (const m of data) {
      if (m.deletedAt) {
        const when = Date.parse(m.deletedAt);
        if (!Number.isNaN(when) && when < cutoff) {
          try {
            const dir = resolveDiskFolder(m.category, m.id);
            await fsp.rm(dir, { recursive: true, force: true });
          } catch {}
          removed.push(m.id);
          continue;
        }
      }
      keep.push(m);
    }
    await writeJson(keep);
    res.json({ ok: true, removed });
  } catch (err) {
    next(err);
  }
}

export async function addImagesToMedicine(req, res, next) {
  try {
    const { id } = req.params;
    const data = await readJson();
    const entry = data.find((m) => m.id === id);
    if (!entry) throw Object.assign(new Error('Not found'), { status: 404 });

    const dir = resolveDiskFolder(entry.category, entry.id);
    await ensureDir(dir);

    let n = await nextImageNumber(dir);
    for (const file of req.files || []) {
      const ext = (mime.extension(file.mimetype) || path.extname(file.originalname).slice(1) || 'jpg').toLowerCase();
      const safeExt = ext === 'jpeg' ? 'jpg' : ext;
      const fileName = `${n}.${safeExt}`;
      await fsp.rename(file.path, path.join(dir, fileName));
      entry.images.push(imageUrl(entry.category, entry.id, fileName));
      n++;
    }
    entry.image = entry.images[0] || entry.image || '';

    await writeJson(data);
    res.json(entry);
  } catch (err) {
    if (req.files?.length) {
      await Promise.allSettled(req.files.map((f) => fsp.rm(f.path, { force: true })));
    }
    next(err);
  }
}

export async function removeImageFromMedicine(req, res, next) {
  try {
    const { id } = req.params;
    const { url } = req.body;
    if (!url) throw Object.assign(new Error('"url" is required'), { status: 400 });
    const data = await readJson();
    const entry = data.find((m) => m.id === id);
    if (!entry) throw Object.assign(new Error('Not found'), { status: 404 });

    const parts = url.split('/');
    const fileName = parts[parts.length - 1];
    const dir = resolveDiskFolder(entry.category, entry.id);
    await fsp.rm(path.join(dir, fileName), { force: true });

    entry.images = entry.images.filter((u) => u !== url);
    entry.image = entry.images[0] || '';
    await writeJson(data);
    res.json(entry);
  } catch (err) {
    next(err);
  }
}
