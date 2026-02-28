import mongoose from 'mongoose';

const inquirySchema = new mongoose.Schema(
  {
    // Legacy single-name support
    customerName: { type: String, trim: true, default: '' },
    // New contact fields
    firstName: { type: String, trim: true, default: '' },
    lastName: { type: String, trim: true, default: '' },
    phone: { type: String, required: true, trim: true },
    email: { type: String, default: '', trim: true },
    city: { type: String, default: '', trim: true },
    state: { type: String, default: '', trim: true },
    brandPreference: { type: String, default: '', trim: true },
    additionalNotes: { type: String, default: '', trim: true },
    quantity: { type: Number, default: 1, min: 1 },
    message: { type: String, default: '', trim: true },
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: false },
    medicineName: { type: String, required: true, trim: true },
    slug: { type: String, default: '' },
    selectedVariant: {
      strength: { type: String, default: '', trim: true },
      form: { type: String, default: '', trim: true },
      packSize: { type: String, default: '', trim: true },
      packagingType: { type: String, default: '', trim: true },
      price: { type: Number, min: 0 },
      sku: { type: String, default: '', trim: true },
    },
    referenceId: { type: String, unique: true, index: true },
    status: { type: String, enum: ['new', 'contacted', 'closed'], default: 'new' },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

export default mongoose.model('Inquiry', inquirySchema);
