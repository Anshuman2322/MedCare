import Medicine, { PUBLIC_MEDICINE_FILTER } from '../models/Medicine.js';
import Category from '../models/Category.js';
import Review from '../models/Review.js';
import mongoose from 'mongoose';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { escapeRegex } from '../utils/sanitize.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FALLBACK_MEDICINES_PATH = path.resolve(__dirname, '../../client/src/data/medicines.json');

let fallbackMedicinesCache = null;

async function loadFallbackMedicines() {
  if (fallbackMedicinesCache) {
    return fallbackMedicinesCache;
  }

  const raw = await readFile(FALLBACK_MEDICINES_PATH, 'utf8');
  const medicines = JSON.parse(raw);
  fallbackMedicinesCache = Array.isArray(medicines)
    ? medicines.map(normalizeFallbackMedicine).filter(Boolean)
    : [];

  return fallbackMedicinesCache;
}

function normalizeFallbackMedicine(medicine) {
  if (!medicine) return null;

  const slugBase = medicine.slug || medicine.id || medicine.name || '';
  const slug = String(slugBase)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const price = Number(medicine.price);
  const stock = medicine.inStock === false ? 0 : 1;
  const category = medicine.category || '';
  const description = medicine.description || '';
  const images = Array.isArray(medicine.images) ? medicine.images.filter(Boolean) : [];
  const rawVariants = Array.isArray(medicine.variants) ? medicine.variants : [];
  const normalizedVariants = rawVariants.map(normalizeVariant).filter(Boolean);

  if (!normalizedVariants.length) {
    normalizedVariants.push({
      strength: medicine.strength || '',
      form: medicine.form || '',
      packSize: medicine.packSize || '',
      packagingType: medicine.packagingType || '',
      price: Number.isFinite(price) ? price : 0,
      sku: medicine.sku || '',
      stock,
    });
  }

  const primaryVariant = normalizedVariants[0] || {};

  return {
    ...medicine,
    _id: medicine._id || medicine.id || slug,
    id: medicine.id || slug,
    slug,
    name: medicine.name || '',
    category,
    description,
    image: medicine.image || images[0] || '',
    images,
    inStock: medicine.inStock !== false,
    manufacturer: medicine.manufacturer || '',
    requiresPrescription: Boolean(medicine.requiresPrescription),
    price: Number.isFinite(price) ? price : null,
    form: primaryVariant.form || medicine.form || '',
    strength: primaryVariant.strength || medicine.strength || '',
    variants: normalizedVariants,
  };
}

async function getFallbackMedicineList() {
  return loadFallbackMedicines();
}

async function saveFallbackMedicines(medicines) {
  const normalized = medicines.map(normalizeFallbackMedicine).filter(Boolean);
  await writeFile(FALLBACK_MEDICINES_PATH, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8');
  fallbackMedicinesCache = normalized;
  return normalized;
}

function findFallbackMedicineIndex(medicines, identifier) {
  const target = String(identifier || '').trim();
  if (!target) return -1;

  return medicines.findIndex((medicine) => {
    const candidateIds = [medicine.slug, medicine._id, medicine.id].filter(Boolean).map((value) => String(value));
    return candidateIds.includes(target);
  });
}

function buildFallbackMedicineRecord(base = {}, update = {}, normalizedVariants = []) {
  const source = { ...base, ...update };
  const primaryVariant = normalizedVariants[0] || source.variants?.[0] || {};
  const images = Array.isArray(source.images) ? source.images.filter(Boolean) : [];
  const image = source.image || images[0] || '';
  const slugBase = source.slug || source.id || source._id || source.name || '';
  const slug = String(slugBase)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return {
    ...source,
    _id: source._id || source.id || slug,
    id: source.id || slug,
    slug,
    name: source.name || '',
    category: source.category || '',
    brand: source.brand || '',
    description: source.description || '',
    manufacturer: source.manufacturer || '',
    requiresPrescription: Boolean(source.requiresPrescription),
    image,
    images,
    inStock: source.inStock !== false,
    composition: source.composition || '',
    usage: source.usage || '',
    dosage: source.dosage || '',
    precautions: source.precautions || '',
    storage: source.storage || '',
    shelfLife: source.shelfLife || '',
    customFields: Array.isArray(source.customFields) ? source.customFields : [],
    metaTitle: source.metaTitle || '',
    metaDescription: source.metaDescription || '',
    keywords: source.keywords || '',
    variants: normalizedVariants.length ? normalizedVariants : Array.isArray(source.variants) ? source.variants : [],
    price: Number.isFinite(Number(primaryVariant.price ?? source.price)) ? Number(primaryVariant.price ?? source.price) : null,
    form: primaryVariant.form || source.form || '',
    strength: primaryVariant.strength || source.strength || '',
  };
}

function matchesFilter(medicine, search, category) {
  if (search) {
    const text = [medicine.name, medicine.description, medicine.category, medicine.manufacturer]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    if (!text.includes(String(search).toLowerCase())) {
      return false;
    }
  }

  if (category) {
    if (String(medicine.category || '').toLowerCase() !== String(category).toLowerCase()) {
      return false;
    }
  }

  return true;
}

function sortFallbackMedicines(medicines, sort) {
  const sorted = [...medicines];

  if (sort === 'price_asc') {
    return sorted.sort((a, b) => (a.price ?? Number.POSITIVE_INFINITY) - (b.price ?? Number.POSITIVE_INFINITY));
  }

  if (sort === 'price_desc') {
    return sorted.sort((a, b) => (b.price ?? Number.NEGATIVE_INFINITY) - (a.price ?? Number.NEGATIVE_INFINITY));
  }

  return sorted;
}

export async function createMedicine(req, res, next) {
  try {
    const {
      slug,
      name,
      brand,
      category,
      image,
      images,
      inStock,
      isPublished,
      description,
      manufacturer,
      requiresPrescription,
      composition,
      usage,
      dosage,
      precautions,
      storage,
      shelfLife,
      customFields,
      metaTitle,
      metaDescription,
      keywords,
      variants,
    } = req.body || {};

    if (!slug || !name) {
      return res.status(400).json({ error: 'slug and name are required' });
    }

    if (mongoose.connection.readyState !== 1) {
      const fallbackMedicines = await getFallbackMedicineList();
      if (findFallbackMedicineIndex(fallbackMedicines, slug) >= 0) {
        return res.status(409).json({ error: 'Medicine with this slug already exists' });
      }

      const medicine = buildFallbackMedicineRecord(
        {
          slug,
          name,
          brand: brand || '',
          category,
          image: image || '',
          images: Array.isArray(images) ? images : [],
          inStock: typeof inStock === 'boolean' ? inStock : deriveInStock(normalizedVariants),
          description,
          manufacturer,
          requiresPrescription,
          composition,
          usage,
          dosage,
          precautions,
          storage,
          shelfLife,
          customFields,
          metaTitle,
          metaDescription,
          keywords,
        },
        {},
        normalizedVariants
      );

      const savedMedicines = await saveFallbackMedicines([...fallbackMedicines, medicine]);
      const saved = savedMedicines.find((item) => item.slug === slug) || medicine;
      return res.status(201).json(saved);
    }

    if (category) {
      try {
        const exists = await Category.findOne({ name: category, isActive: true });
        if (!exists) {
          return res.status(400).json({ error: 'Category does not exist' });
        }
      } catch (error) {
        if (error?.name !== 'MongooseError') {
          throw error;
        }
      }
    }

    const existing = await Medicine.findOne({ slug });
    if (existing) {
      return res.status(409).json({ error: 'Medicine with this slug already exists' });
    }

    const normalizedVariants = buildVariants(variants, req.body);
    if (!normalizedVariants.length) {
      return res.status(400).json({ error: 'At least one valid variant with price and stock is required' });
    }

    const resolvedInStock = typeof inStock === 'boolean' ? inStock : deriveInStock(normalizedVariants);

    const medicine = await Medicine.create({
      slug,
      name,
      category,
      brand: brand || '',
      image: image || '',
      images: Array.isArray(images) ? images : [],
      inStock: resolvedInStock,
      isPublished: isPublished !== false,
      description,
      manufacturer,
      requiresPrescription,
      composition,
      usage,
      dosage,
      precautions,
      storage,
      shelfLife,
      variants: normalizedVariants,
      customFields,
      metaTitle,
      metaDescription,
      keywords,
    });

    res.status(201).json(medicine);
  } catch (error) {
    next(error);
  }
}

export const getAllMedicines = (req, res, next) => listMedicines(req, res, next, PUBLIC_MEDICINE_FILTER);
export const getAllMedicinesForAdmin = (req, res, next) => listMedicines(req, res, next, {});

async function listMedicines(req, res, next, visibility) {
  try {
    const { search, category, sort } = req.query || {};

    if (mongoose.connection.readyState !== 1) {
      const fallbackMedicines = await getFallbackMedicineList();
      const filteredMedicines = fallbackMedicines.filter((medicine) => matchesFilter(medicine, search, category));
      return res.json(sortFallbackMedicines(filteredMedicines, sort));
    }

    const filter = { ...visibility };
    if (search) {
      filter.name = { $regex: escapeRegex(search), $options: 'i' };
    }
    if (category) {
      filter.category = { $regex: `^${escapeRegex(category)}$`, $options: 'i' };
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { 'variants.price': 1 };
    if (sort === 'price_desc') sortOption = { 'variants.price': -1 };

    const meds = await Medicine.find(filter).sort(sortOption);
    res.json(await withRatings(meds));
  } catch (error) {
    next(error);
  }
}

// Adds `rating` (average of approved reviews) and `reviewCount` to products
// that have reviews; products without reviews are returned unchanged.
async function withRatings(meds) {
  const ratings = await Review.ratingsFor(meds.map((m) => m._id));
  return meds.map((m) => {
    const r = ratings.get(String(m._id));
    return r ? { ...m.toJSON(), rating: r.average, reviewCount: r.count } : m;
  });
}

export const getMedicineBySlug = (req, res, next) => readMedicine(req, res, next, PUBLIC_MEDICINE_FILTER);
export const getMedicineBySlugForAdmin = (req, res, next) => readMedicine(req, res, next, {});

async function readMedicine(req, res, next, visibility) {
  try {
    const { slug } = req.params;
    if (mongoose.connection.readyState !== 1) {
      const fallbackMedicines = await getFallbackMedicineList();
      const medicine = fallbackMedicines.find((item) => {
        const candidateIds = [item.slug, item._id, item.id].filter(Boolean).map((value) => String(value));
        return candidateIds.includes(String(slug));
      });

      if (!medicine) {
        return res.status(404).json({ error: 'Medicine not found' });
      }

      return res.json(medicine);
    }

    const or = [{ slug }];

    if (mongoose.Types.ObjectId.isValid(slug)) {
      or.push({ _id: slug });
    }

    const medicine = await Medicine.findOne({ ...visibility, $or: or });

    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    const [withRating] = await withRatings([medicine]);
    res.json(withRating);
  } catch (error) {
    next(error);
  }
}

export async function updateMedicineById(req, res, next) {
  try {
    const { id } = req.params;
    const update = req.body || {};
    const query = buildMedicineLookupQuery(id);

    if (mongoose.connection.readyState !== 1) {
      const fallbackMedicines = await getFallbackMedicineList();
      const index = findFallbackMedicineIndex(fallbackMedicines, id);

      if (index === -1) {
        return res.status(404).json({ error: 'Medicine not found' });
      }

      const existing = fallbackMedicines[index];
      const normalizedVariants =
        update.variants !== undefined
          ? buildVariants(update.variants, { ...existing, ...update })
          : existing.variants || [];

      if (!normalizedVariants.length) {
        return res.status(400).json({ error: 'At least one valid variant with price and stock is required' });
      }

      const resolvedInStock =
        typeof update.inStock === 'boolean'
          ? update.inStock
          : deriveInStock(normalizedVariants);

      const medicine = buildFallbackMedicineRecord(
        { ...existing, ...update, inStock: resolvedInStock },
        {},
        normalizedVariants
      );

      const nextMedicines = [...fallbackMedicines];
      nextMedicines[index] = medicine;
      const savedMedicines = await saveFallbackMedicines(nextMedicines);
      const saved = savedMedicines[index] || medicine;
      return res.json(saved);
    }

    if (update.category) {
      try {
        const exists = await Category.findOne({ name: update.category, isActive: true });
        if (!exists) {
          return res.status(400).json({ error: 'Category does not exist' });
        }
      } catch (error) {
        if (error?.name !== 'MongooseError') {
          throw error;
        }
      }
    }

    const existing = await Medicine.findOne(query);
    if (!existing) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    const normalizedVariants =
      update.variants !== undefined
        ? buildVariants(update.variants, { ...existing.toObject(), ...update })
        : existing.variants;

    if (!normalizedVariants.length) {
      return res.status(400).json({ error: 'At least one valid variant with price and stock is required' });
    }

    const resolvedInStock =
      typeof update.inStock === 'boolean'
        ? update.inStock
        : deriveInStock(normalizedVariants);

    const medicine = await Medicine.findOneAndUpdate(
      query,
      { ...update, variants: normalizedVariants, inStock: resolvedInStock },
      { new: true, runValidators: true }
    );
    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    res.json(medicine);
  } catch (error) {
    next(error);
  }
}

function buildVariants(rawVariants, legacy = {}) {
  const candidates = Array.isArray(rawVariants) ? rawVariants : [];

  const normalized = candidates
    .map(normalizeVariant)
    .filter(Boolean);

  if (!normalized.length) {
    const fallback = normalizeVariant({
      strength: legacy.strength,
      form: legacy.form,
      packSize: legacy.packSize,
      packagingType: legacy.packagingType,
      price: legacy.price,
      stock: legacy.stock ?? (legacy.inStock ? 1 : 0),
      sku: legacy.sku,
    });
    if (fallback) normalized.push(fallback);
  }

  return normalized;
}

function normalizeVariant(variant) {
  if (!variant) return null;

  const price = Number(variant.price);
  const stock = Number(variant.stock ?? variant.quantity ?? variant.qty ?? 0);

  if (!Number.isFinite(price) || price < 0) return null;
  if (!Number.isFinite(stock) || stock < 0) return null;

  return {
    strength: typeof variant.strength === 'string' ? variant.strength.trim() : '',
    form: typeof variant.form === 'string' ? variant.form.trim() : '',
    packSize: typeof variant.packSize === 'string' ? variant.packSize.trim() : '',
    packagingType: typeof variant.packagingType === 'string' ? variant.packagingType.trim() : '',
    price,
    sku: typeof variant.sku === 'string' ? variant.sku.trim() : '',
    stock: Math.round(stock),
  };
}

function deriveInStock(variants = []) {
  return variants.some((v) => Number(v?.stock) > 0);
}

// Changes isPublished and nothing else. The general update route also
// recalculates inStock, which a visibility toggle must not do.
export async function setMedicineVisibility(req, res, next) {
  try {
    const { isPublished } = req.body || {};
    if (typeof isPublished !== 'boolean') {
      return res.status(400).json({ error: 'isPublished must be true or false' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database is unavailable. Please try again shortly.' });
    }

    const medicine = await Medicine.findOneAndUpdate(
      buildMedicineLookupQuery(req.params.id),
      { $set: { isPublished } },
      { new: true }
    ).select('slug isPublished');

    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    res.json({ success: true, slug: medicine.slug, isPublished: medicine.isPublished });
  } catch (error) {
    next(error);
  }
}

export async function deleteMedicineById(req, res, next) {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState !== 1) {
      const fallbackMedicines = await getFallbackMedicineList();
      const index = findFallbackMedicineIndex(fallbackMedicines, id);

      if (index === -1) {
        return res.status(404).json({ error: 'Medicine not found' });
      }

      const nextMedicines = fallbackMedicines.filter((_, itemIndex) => itemIndex !== index);
      await saveFallbackMedicines(nextMedicines);
      return res.json({ message: 'Medicine deleted successfully' });
    }

    const deleted = await Medicine.findOneAndDelete(buildMedicineLookupQuery(id));

    if (!deleted) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    res.json({ message: 'Medicine deleted successfully' });
  } catch (error) {
    next(error);
  }
}

export function buildMedicineLookupQuery(identifier) {
  const slug = String(identifier || '').trim();
  const query = { slug };

  if (mongoose.Types.ObjectId.isValid(slug)) {
    return { $or: [{ slug }, { _id: slug }] };
  }

  return query;
}
