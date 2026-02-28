import Medicine from '../models/Medicine.js';
import Category from '../models/Category.js';
import mongoose from 'mongoose';

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
