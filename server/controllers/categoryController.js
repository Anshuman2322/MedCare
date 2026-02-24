import Category from '../models/Category.js';
import Medicine from '../models/Medicine.js';

const slugify = (name = '') => name.toString().trim().toLowerCase().replace(/\s+/g, '-');

export async function getCategories(_req, res, next) {
  try {
    const categories = await Category.find({ $or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }] }).sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    next(error);
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
    next(error);
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
