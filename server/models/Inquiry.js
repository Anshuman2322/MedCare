import mongoose from 'mongoose';

const inquirySchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, default: '', trim: true },
    quantity: { type: Number, default: 1, min: 1 },
    message: { type: String, default: '', trim: true },
    medicineId: { type: String, default: '', trim: true },
    medicineName: { type: String, required: true, trim: true },
    slug: { type: String, default: '' },
    status: { type: String, enum: ['new', 'contacted', 'closed'], default: 'new' },
  },
  { timestamps: true }
);

export default mongoose.model('Inquiry', inquirySchema);
