import mongoose from 'mongoose';

// One line of a multi-medicine cart request. Every value here is resolved from
// the Medicine collection at submit time — nothing is copied from the browser.
const inquiryItemSchema = new mongoose.Schema(
  {
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
    medicineName: { type: String, required: true, trim: true },
    slug: { type: String, default: '', trim: true },
    quantity: { type: Number, required: true, min: 1 },
    listedPrice: { type: Number, min: 0 },
    variant: {
      strength: { type: String, default: '', trim: true },
      form: { type: String, default: '', trim: true },
      packSize: { type: String, default: '', trim: true },
      packagingType: { type: String, default: '', trim: true },
      sku: { type: String, default: '', trim: true },
    },
  },
  { _id: false }
);

const inquirySchema = new mongoose.Schema(
  {
    // 'inquiry' covers every existing single-medicine submission; 'best_price'
    // marks a request for the team's best available quote on a quantity.
    requestType: { type: String, enum: ['inquiry', 'best_price'], default: 'inquiry', index: true },
    // Empty for single-medicine inquiries, which keep using the flat fields below.
    items: { type: [inquiryItemSchema], default: [] },
    // Legacy single-name support
    customerName: { type: String, trim: true, default: '' },
    // New contact fields
    firstName: { type: String, trim: true, default: '' },
    lastName: { type: String, trim: true, default: '' },
    phone: { type: String, required: false, trim: true, default: '' },
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
    status: { type: String, enum: ['new', 'contacted', 'closed'], default: 'new', index: true },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

// Admin inquiry list filters by status and always sorts by createdAt.
inquirySchema.index({ status: 1, createdAt: -1 });
inquirySchema.index({ requestType: 1, createdAt: -1 });

export default mongoose.model('Inquiry', inquirySchema);
