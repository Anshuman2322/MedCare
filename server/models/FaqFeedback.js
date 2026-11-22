import mongoose from 'mongoose';

// One counter document per FAQ entry: how many visitors found the answer
// helpful or not. No personal data is stored, so voting needs no login.
const faqFeedbackSchema = new mongoose.Schema(
  {
    faqId: { type: String, required: true, unique: true, trim: true },
    helpful: { type: Number, default: 0, min: 0 },
    unhelpful: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.FaqFeedback || mongoose.model('FaqFeedback', faqFeedbackSchema);
