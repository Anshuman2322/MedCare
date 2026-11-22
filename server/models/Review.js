import mongoose from 'mongoose';
import { REVIEW_TOPICS } from '../services/reviewDrafts.js';

export const REVIEW_STATUSES = ['pending', 'approved', 'rejected'];

// A customer review. With `medicine` it belongs to that product; without it, it
// is a review of CureNeed as a whole. Reviews go live (`approved`) as soon as
// they are posted; an admin can hide one (`rejected`) or show it again at any
// time. `pending` is only left on reviews posted before that change. `email` is
// optional, lets the team follow up, and is never returned by a public endpoint.
const reviewSchema = new mongoose.Schema(
  {
    medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', default: null },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, default: '', maxlength: 80 },
    body: { type: String, trim: true, required: true, maxlength: 1000 },
    name: { type: String, trim: true, required: true, maxlength: 60 },
    country: { type: String, trim: true, default: '', maxlength: 60 },
    email: { type: String, trim: true, lowercase: true, default: '' },
    // What the customer said the review is about (prices, support, delivery...).
    topics: {
      type: [{ type: String, enum: Object.keys(REVIEW_TOPICS) }],
      default: [],
      validate: { validator: (list) => list.length <= 4, message: 'At most 4 topics' },
    },
    // True when the customer started from a suggested draft. Shown to admins only.
    assisted: { type: Boolean, default: false },
    status: { type: String, enum: REVIEW_STATUSES, default: 'pending' },
    // Pinned to the top of the home page reviews (approved reviews only). Every
    // live review appears on the home page anyway, newest first.
    featured: { type: Boolean, default: false },
    // Set by an admin who has matched the review to a real enquiry or order.
    verifiedBuyer: { type: Boolean, default: false },
    reply: { type: String, trim: true, default: '', maxlength: 1000 },
    repliedAt: { type: Date, default: null },
    approvedAt: { type: Date, default: null },
    // When an admin first saw it in the panel; null means "new" (sidebar badge).
    seenAt: { type: Date, default: null },
  },
  { timestamps: true }
);

reviewSchema.index({ medicine: 1, status: 1, createdAt: -1 });
reviewSchema.index({ status: 1, featured: 1, createdAt: -1 });
reviewSchema.index({ status: 1, createdAt: -1 });

/** "rahul sharma" -> "Rahul S."; "ales" -> "Ales". */
export function displayName(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'Customer';
  const first = parts[0][0].toUpperCase() + parts[0].slice(1);
  return parts.length < 2 ? first : `${first} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

/** Average and count of approved reviews per medicine id, as a Map. */
reviewSchema.statics.ratingsFor = async function ratingsFor(medicineIds) {
  if (!medicineIds?.length) return new Map();
  const rows = await this.aggregate([
    { $match: { medicine: { $in: medicineIds }, status: 'approved' } },
    { $group: { _id: '$medicine', average: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), { average: Math.round(r.average * 10) / 10, count: r.count }]));
};

const Review = mongoose.model('Review', reviewSchema);
export default Review;
