import Medicine from '../models/Medicine.js';
import Category from '../models/Category.js';
import mongoose from 'mongoose';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FALLBACK_MEDICINES_PATH = path.resolve(__dirname, '../../client/src/data/medicines.json');
const FALLBACK_CATEGORIES_PATH = path.resolve(__dirname, '../../client/src/data/categories.json');

async function loadFallbackMedicines() {
  const raw = await readFile(FALLBACK_MEDICINES_PATH, 'utf8');
  const medicines = JSON.parse(raw);
  return Array.isArray(medicines) ? medicines.filter(Boolean) : [];
}

async function loadFallbackCategories() {
  const raw = await readFile(FALLBACK_CATEGORIES_PATH, 'utf8');
  const categories = JSON.parse(raw);
  return Array.isArray(categories) ? categories.filter(Boolean) : [];
}

export async function getDashboardStats(_req, res, next) {
  try {
    if (mongoose.connection.readyState !== 1) {
      const medicines = await loadFallbackMedicines();
      const categories = await loadFallbackCategories();
      const totalMedicines = medicines.length;
      const inStock = medicines.filter((medicine) => medicine.inStock !== false).length;
      const outOfStock = Math.max(totalMedicines - inStock, 0);
      const totalCategories = categories.length;
      const recentMedicines = medicines.slice(0, 5).map((medicine) => ({
        name: medicine.name || '',
        category: medicine.category || '',
        price: medicine.price ?? 0,
        inStock: medicine.inStock !== false,
        createdAt: medicine.createdAt || null,
        slug: medicine.slug || medicine.id || '',
      }));

      return res.json({
        totalMedicines,
        inStock,
        outOfStock,
        totalCategories,
        recentMedicines,
      });
    }

    const [totalMedicines, inStock, outOfStock, categoryCountFromCollection, distinctCategories, recentMedicines] =
      await Promise.all([
        Medicine.countDocuments(),
        Medicine.countDocuments({ inStock: true }),
        Medicine.countDocuments({ inStock: false }),
        Category.countDocuments(),
        Medicine.distinct('category', { category: { $ne: '' } }),
        Medicine.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .select('name category price inStock createdAt slug'),
      ]);

    const totalCategories = Math.max(categoryCountFromCollection, distinctCategories.length);

    res.json({
      totalMedicines,
      inStock,
      outOfStock,
      totalCategories,
      recentMedicines,
    });
  } catch (error) {
    next(error);
  }
}
