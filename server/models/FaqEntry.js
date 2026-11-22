import mongoose from 'mongoose';

// Admin changes to the FAQ. Two kinds of document share this collection:
//  - custom: a question the team added in the admin panel (faqId "custom-...");
//  - override: an edited copy of a built-in question from server/data/faq.js
//    (same faqId). Deleting an override restores the built-in text.
// The built-in entries themselves live in code and are never written here.
const faqEntrySchema = new mongoose.Schema(
  {
    faqId: { type: String, required: true, unique: true, trim: true },
    custom: { type: Boolean, default: false },
    category: { type: String, required: true, trim: true },
    question: { type: String, required: true, trim: true, maxlength: 200 },
    answer: { type: String, required: true, trim: true, maxlength: 2000 },
    alternatives: [{ type: String, trim: true, maxlength: 200 }],
    keywords: [{ type: String, trim: true, maxlength: 40 }],
    priority: { type: Number, default: 5, min: 1, max: 10 },
    published: { type: Boolean, default: true },
    escalate: { type: Boolean, default: false },
    related: [{ type: String, trim: true }],
    links: [{ _id: false, label: { type: String, trim: true, maxlength: 60 }, to: { type: String, trim: true, maxlength: 200 } }],
    updatedBy: { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

export default mongoose.models.FaqEntry || mongoose.model('FaqEntry', faqEntrySchema);
