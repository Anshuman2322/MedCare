import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import mime from 'mime-types';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..', '..');

// Default to repo's src/data/medicines.json used by the main site
const DATA_JSON_PATH = process.env.DATA_JSON_PATH
  ? path.resolve(ROOT, process.env.DATA_JSON_PATH)
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
      const m = /^(\d+)\.[a-z0-9]+$/i.exec(f);
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

export async function listMedicines(_req, res) {
  const data = await readJson();
  res.json(data);
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
      requiresPrescription = true,
      inStock = true,
      dosage = '',
      usage = '',
      details = ''
    } = req.body;

    if (!name) throw Object.assign(new Error('Name is required'), { status: 400 });

    const normalizedCategory = validateCategory(category);
    const id = slug(name);

    const data = await readJson();
    if (data.some((m) => m.id === id)) {
      throw Object.assign(new Error('Duplicate medicine ID'), { status: 409 });
    }

    const dir = resolveDiskFolder(normalizedCategory, id);
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
      urls.push(imageUrl(normalizedCategory, id, finalName));
      n++;
    }

    // Normalize details to array of { label, value }
    let detailsArr = [];
    if (Array.isArray(details)) {
      detailsArr = details;
    } else if (typeof details === 'string' && details.trim()) {
      try { detailsArr = JSON.parse(details); } catch { detailsArr = []; }
    }

    const entry = {
      id,
      name,
      category: normalizedCategory,
      price: Number(price),
      form,
      image: urls[0] || '',
      images: urls,
      inStock: Boolean(inStock),
      description,
      manufacturer,
      requiresPrescription: String(requiresPrescription) !== 'false',
      dosage,
      usage,
      details: detailsArr
    };

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

    if (body.category) {
      const newCat = validateCategory(body.category);
      if (newCat !== targetCat) {
        // With flat storage, category change doesn't move files; update JSON only
        targetCat = newCat;
      }
    }

    const entry = data[idx];
    // Apply target id/category to entry now
    entry.id = targetId;
    entry.category = targetCat;
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
    const scalars = ['name', 'price', 'form', 'description', 'manufacturer', 'requiresPrescription', 'inStock', 'dosage', 'usage'];
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

    // If ID changed, rewrite image URLs to the new path to avoid 404s
    if (targetId !== id) {
      entry.images = (entry.images || []).map((u) => {
        const fileName = path.basename(u);
        return imageUrl(entry.category, entry.id, fileName);
      });
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

    const dir = resolveDiskFolder(data[idx].category, id);
    await fsp.rm(dir, { recursive: true, force: true });

    const removed = data.splice(idx, 1)[0];
    await writeJson(data);
    res.json({ removed });
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
