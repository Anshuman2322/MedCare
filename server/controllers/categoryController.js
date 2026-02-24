import Category from '../models/Category.js';

function slugify(name = '') {
  return name
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function listCategories(_req, res, next) {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    next(error);
  }
}

export async function createCategory(req, res, next) {
  try {
    const { name } = req.body || {};
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const normalizedName = name.trim();
    const slug = slugify(normalizedName);

    const existing = await Category.findOne({ $or: [{ name: normalizedName }, { slug }] });
    if (existing) {
      return res.status(409).json({ error: 'Category already exists' });
    }

    const category = await Category.create({ name: normalizedName, slug });
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
}

export async function deleteCategory(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ message: 'Category deleted' });
  } catch (error) {
    next(error);
  }
}
