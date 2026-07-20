import Category from '../models/Category.js';
import Medicine from '../models/Medicine.js';
import mongoose from 'mongoose';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const slugify = (name = '') => name.toString().trim().toLowerCase().replace(/\s+/g, '-');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FALLBACK_CATEGORIES_PATH = path.resolve(__dirname, '../../client/src/data/categories.json');
const FALLBACK_MEDICINES_PATH = path.resolve(__dirname, '../../client/src/data/medicines.json');

async function loadFallbackCategories() {
  const raw = await readFile(FALLBACK_CATEGORIES_PATH, 'utf8');
  const categories = JSON.parse(raw);

  return Array.isArray(categories)
    ? uniqueCategoriesByName(categories.map(normalizeFallbackCategory).filter(Boolean))
    : [];
}

async function loadFallbackMedicines() {
  const raw = await readFile(FALLBACK_MEDICINES_PATH, 'utf8');
  const medicines = JSON.parse(raw);

  return Array.isArray(medicines) ? medicines.filter(Boolean) : [];
}

function normalizeFallbackCategory(category) {
  if (!category) return null;

  if (typeof category === 'string') {
    const name = category.trim();
    if (!name) return null;
    return {
      name,
      slug: slugify(name),
      description: '',
      isActive: true,
    };
  }

  const name = String(category.name || '').trim();
  if (!name) return null;

  return {
    ...category,
    name,
    slug: category.slug || slugify(name),
    description: category.description || '',
    isActive: category.isActive !== false,
  };
}

function normalizeMedicineCategory(medicine = {}) {
  return String(medicine.category || '').trim();
}

function uniqueCategoriesByName(categories = []) {
  const seen = new Set();
  return categories.filter((category) => {
    const key = String(category?.name || '').trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function getCategories(_req, res, next) {
  try {
    if (mongoose.connection.readyState !== 1) {
      const categories = await loadFallbackCategories();
      return res.json(uniqueCategoriesByName(categories).sort((a, b) => a.name.localeCompare(b.name)));
    }

    const categories = await Category.find({ $or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }] }).sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    try {
      const categories = await loadFallbackCategories();
      res.json(uniqueCategoriesByName(categories).sort((a, b) => a.name.localeCompare(b.name)));
    } catch (fallbackError) {
      next(error);
    }
  }
}

export async function createCategory(req, res, next) {
  try {
    const { name, description } = req.body || {};
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const normalizedName = name.trim();
    const slug = slugify(normalizedName);

    const existing = await Category.findOne({ $or: [{ name: normalizedName }, { slug }] });
    if (existing) {
      return res.status(409).json({ error: 'Category already exists' });
    }

    const category = await Category.create({
      name: normalizedName,
      slug,
      description: description || '',
    });

    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
}

export async function getCategoriesWithCount(_req, res, next) {
  try {
    if (mongoose.connection.readyState !== 1) {
      const categories = await loadFallbackCategories();
      const medicines = await loadFallbackMedicines();
      const counts = medicines.reduce((acc, medicine) => {
        const categoryName = normalizeMedicineCategory(medicine);
        if (!categoryName) return acc;
        acc[categoryName] = (acc[categoryName] || 0) + 1;
        return acc;
      }, {});

      const fallback = uniqueCategoriesByName(categories)
        .map((category) => ({
          ...category,
          productCount: counts[category.name] || 0,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      return res.json(fallback);
    }

    const categories = await Category.aggregate([
      {
        $lookup: {
          from: Medicine.collection.name,
          let: { categoryName: '$name' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$category', '$$categoryName'] },
              },
            },
            { $count: 'count' },
          ],
          as: 'productStats',
        },
      },
      {
        $addFields: {
          productCount: { $ifNull: [{ $arrayElemAt: ['$productStats.count', 0] }, 0] },
        },
      },
      {
        $project: {
          productStats: 0,
          description: 0,
          createdAt: 0,
          updatedAt: 0,
          __v: 0,
        },
      },
      { $sort: { name: 1 } },
    ]);

    res.json(categories);
  } catch (error) {
    try {
      const categories = await loadFallbackCategories();
      const medicines = await loadFallbackMedicines();
      const counts = medicines.reduce((acc, medicine) => {
        const categoryName = normalizeMedicineCategory(medicine);
        if (!categoryName) return acc;
        acc[categoryName] = (acc[categoryName] || 0) + 1;
        return acc;
      }, {});

      const fallback = uniqueCategoriesByName(categories)
        .map((category) => ({
          ...category,
          productCount: counts[category.name] || 0,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      return res.json(fallback);
    } catch (fallbackError) {
      next(error);
    }
  }
}

export async function deleteCategory(req, res, next) {
  try {
    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ message: 'Category deleted' });
  } catch (error) {
    next(error);
  }
}
