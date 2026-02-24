import Medicine from '../models/Medicine.js';
import Category from '../models/Category.js';

export async function getDashboardStats(_req, res, next) {
  try {
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
