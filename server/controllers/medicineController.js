import Medicine from '../models/Medicine.js';
import mongoose from 'mongoose';

export async function createMedicine(req, res, next) {
  try {
    const {
      slug,
      name,
      category,
      price,
      form,
      image,
      images,
      inStock,
      description,
      manufacturer,
      requiresPrescription,
      strength,
      composition,
      usage,
      dosage,
      precautions,
      storage,
      packSize,
      packagingType,
      shelfLife,
    } = req.body || {};

    if (!slug || !name || price === undefined) {
      return res.status(400).json({ error: 'slug, name and price are required' });
    }

    const existing = await Medicine.findOne({ slug });
    if (existing) {
      return res.status(409).json({ error: 'Medicine with this slug already exists' });
    }

    const medicine = await Medicine.create({
      slug,
      name,
      category,
      price,
      form,
      image: image || '',
      images: Array.isArray(images) ? images : [],
      inStock,
      description,
      manufacturer,
      requiresPrescription,
      strength,
      composition,
      usage,
      dosage,
      precautions,
      storage,
      packSize,
      packagingType,
      shelfLife,
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
    if (sort === 'price_asc') sortOption = { price: 1 };
    if (sort === 'price_desc') sortOption = { price: -1 };

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

    const medicine = await Medicine.findByIdAndUpdate(id, update, { new: true });
    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    res.json(medicine);
  } catch (error) {
    next(error);
  }
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
