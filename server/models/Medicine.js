import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, index: true, trim: true },
    name: { type: String, required: true, trim: true },
    brand: { type: String, default: '' },
    category: { type: String, default: '', trim: true },
    price: { type: Number, required: true, min: 0 },
    form: { type: String, default: '' },
    image: { type: String, default: '' },
    images: [{ type: String }],
    inStock: { type: Boolean, default: true },
    // Medical details
    strength: { type: String, default: '' },
    composition: { type: String, default: '' },
    usage: { type: String, default: '' },
    dosage: { type: String, default: '' },
    precautions: { type: String, default: '' },
    storage: { type: String, default: '' },
    requiresPrescription: { type: Boolean, default: false },
    // Packaging
    packSize: { type: String, default: '' },
    packagingType: { type: String, default: '' },
    shelfLife: { type: String, default: '' },
    // General
    description: { type: String, default: '' },
    manufacturer: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('Medicine', medicineSchema);
