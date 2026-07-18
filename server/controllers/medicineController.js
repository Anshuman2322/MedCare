import Medicine from '../models/Medicine.js';
import Category from '../models/Category.js';
import mongoose from 'mongoose';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

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
    form: medicine.form || '',
    strength: medicine.strength || '',
    variants: [
      {
        strength: medicine.strength || '',
        form: medicine.form || '',
        packSize: medicine.packSize || '',
        packagingType: medicine.packagingType || '',
        price: Number.isFinite(price) ? price : 0,
        sku: medicine.sku || '',
        stock,
      },
    ],
  };
}

async function getFallbackMedicineList() {
  return loadFallbackMedicines();
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

    if (category) {
      const exists = await Category.findOne({ name: category, isActive: true });
      if (!exists) {
        return res.status(400).json({ error: 'Category does not exist' });
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

export async function getAllMedicines(req, res, next) {
  try {
    const { search, category, sort } = req.query || {};

    if (mongoose.connection.readyState !== 1) {
      const fallbackMedicines = await getFallbackMedicineList();
      const filteredMedicines = fallbackMedicines.filter((medicine) => matchesFilter(medicine, search, category));
      return res.json(sortFallbackMedicines(filteredMedicines, sort));
    }

    const filter = {};
    if (search) {
      filter.name = { $regex: String(search), $options: 'i' };
    }
    if (category) {
      filter.category = { $regex: `^${String(category)}$`, $options: 'i' };
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { 'variants.price': 1 };
    if (sort === 'price_desc') sortOption = { 'variants.price': -1 };

    const meds = await Medicine.find(filter).sort(sortOption);
    res.json(meds);
  } catch (error) {
    next(error);
  }
}

export async function getMedicineBySlug(req, res, next) {
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

    const medicine = await Medicine.findOne({ $or: or });

    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    res.json(medicine);
  } catch (error) {
    next(error);
  }
}

export async function updateMedicineById(req, res, next) {
  try {
    const { id } = req.params;
    const update = req.body || {};

    if (update.category) {
      const exists = await Category.findOne({ name: update.category, isActive: true });
      if (!exists) {
        return res.status(400).json({ error: 'Category does not exist' });
      }
    }

    const existing = await Medicine.findById(id);
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

    const medicine = await Medicine.findByIdAndUpdate(
      id,
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

export async function deleteMedicineById(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await Medicine.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    res.json({ message: 'Medicine deleted successfully' });
  } catch (error) {
    next(error);
  }
}
