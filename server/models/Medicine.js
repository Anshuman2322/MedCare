import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema(
  {
    strength: { type: String, default: '', trim: true },
    form: { type: String, default: '', trim: true },
    packSize: { type: String, default: '', trim: true },
    packagingType: { type: String, default: '', trim: true },
    price: { type: Number, required: true, min: 0 },
    sku: { type: String, default: '', trim: true },
    stock: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const medicineSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, index: true, trim: true },
    name: { type: String, required: true, trim: true },
    brand: { type: String, default: '' },
    category: { type: String, default: '', trim: true },
    description: { type: String, default: '' },
    manufacturer: { type: String, default: '' },
    images: [{ type: String }],
    image: { type: String, default: '' },
    inStock: { type: Boolean, default: true },
    requiresPrescription: { type: Boolean, default: false },
    composition: { type: String, default: '' },
    usage: { type: String, default: '' },
    dosage: { type: String, default: '' },
    precautions: { type: String, default: '' },
    storage: { type: String, default: '' },
    shelfLife: { type: String, default: '' },
    customFields: [
      {
        section: { type: String, default: '', trim: true },
        label: { type: String, default: '', trim: true },
        value: { type: String, default: '', trim: true },
      },
    ],
    variants: {
      type: [variantSchema],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'At least one variant is required',
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

medicineSchema.virtual('price').get(function price() {
  return this.variants?.[0]?.price ?? null;
});

medicineSchema.virtual('defaultVariant').get(function defaultVariant() {
  return this.variants?.[0] || null;
});

medicineSchema.pre('validate', function ensureVariant(next) {
  if (!this.variants || this.variants.length === 0) {
    this.invalidate('variants', 'At least one variant is required');
  }
  next();
});

export default mongoose.model('Medicine', medicineSchema);
