import mongoose from 'mongoose';
import { body, query } from 'express-validator';
import Review, { REVIEW_STATUSES, displayName } from '../models/Review.js';
import Medicine, { PUBLIC_MEDICINE_FILTER } from '../models/Medicine.js';
import { buildMedicineLookupQuery } from './medicineController.js';
import { handleValidation } from './auth.controller.js';
import { REVIEW_TOPICS, createReviewDrafts } from '../services/reviewDrafts.js';

const TOPIC_KEYS = Object.keys(REVIEW_TOPICS);
const topicsRule = (field, { required }) =>
  (required ? body(field) : body(field).optional())
    .isArray({ min: required ? 1 : 0, max: 4 })
    .withMessage('Choose up to 4 topics.')
    .bail()
    .custom((list) => list.every((t) => TOPIC_KEYS.includes(t)))
    .withMessage('Unknown topic.')
    .customSanitizer((list) => [...new Set(list)]);

const THANK_YOU = 'Thank you! Your review has been received.';
const LINK = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|info|xyz|ru|top|shop)\b)/i;
// Reviews go live straight away, so contact details are kept out of them.
const EMAIL_IN_TEXT = /[^\s@]+@[^\s@]+\.[a-z]{2,}/i;
const PHONE_IN_TEXT = /(?:\+?\d[\s().-]?){9,}/;
const SORTS = {
  newest: { createdAt: -1 },
  highest: { rating: -1, createdAt: -1 },
  lowest: { rating: 1, createdAt: -1 },
};

const dbReady = (res) => {
  if (mongoose.connection.readyState === 1) return true;
  res.status(503).json({ error: 'Reviews are unavailable right now. Please try again shortly.' });
  return false;
};

function toPublic(review) {
  const product = review.medicine && review.medicine.slug ? { name: review.medicine.name, slug: review.medicine.slug } : null;
  return {
    id: String(review._id),
    rating: review.rating,
    title: review.title,
    body: review.body,
    author: displayName(review.name),
    country: review.country,
    topics: review.topics || [],
    verifiedBuyer: review.verifiedBuyer,
    reply: review.reply || '',
    repliedAt: review.repliedAt,
    createdAt: review.createdAt,
    ...(product ? { product } : {}),
  };
}

const findPublicMedicine = (identifier) =>
  Medicine.findOne({ ...buildMedicineLookupQuery(identifier), ...PUBLIC_MEDICINE_FILTER }).select('_id name slug');

// Live reviews that may appear on the public site: store reviews plus reviews of
// products that are still published (a hidden product's name must not leak).
async function publicScope() {
  const hidden = await Medicine.find({ isPublished: false }).distinct('_id');
  return { status: 'approved', medicine: { $nin: hidden } };
}

/** Average, count and 1–5 star breakdown of the approved reviews matching `match`. */
async function summarise(match) {
  const rows = await Review.aggregate([{ $match: match }, { $group: { _id: '$rating', count: { $sum: 1 } } }]);
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let count = 0;
  let total = 0;
  for (const row of rows) {
    distribution[row._id] = row.count;
    count += row.count;
    total += row._id * row.count;
  }
  return { average: count ? Math.round((total / count) * 10) / 10 : 0, count, distribution };
}

// ---------------------------------------------------------------- public

export const listReviewsRules = [
  query('product').optional().isString().trim().isLength({ max: 200 }),
  query('sort').optional().isIn(Object.keys(SORTS)).withMessage('Unknown sort'),
  query('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating filter must be 1 to 5').toInt(),
  query('page').optional().isInt({ min: 1, max: 1000 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 20 }).toInt(),
];

/** GET /api/reviews?product=<slug|id>&sort=&rating=&page=&limit= */
export async function listReviews(req, res, next) {
  try {
    if (handleValidation(req, res)) return;
    if (!dbReady(res)) return;
    const { product, sort = 'newest', rating, page = 1, limit = 6 } = req.query;

    let scope;
    if (product) {
      const medicine = await findPublicMedicine(product);
      if (!medicine) return res.status(404).json({ error: 'Product not found' });
      scope = { status: 'approved', medicine: medicine._id };
    } else {
      scope = await publicScope();
    }

    const match = rating ? { ...scope, rating } : scope;
    const [summary, total, reviews] = await Promise.all([
      summarise(scope),
      Review.countDocuments(match),
      Review.find(match)
        .sort(SORTS[sort])
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('medicine', 'name slug'),
    ]);

    res.json({ summary, reviews: reviews.map(toPublic), page, pages: Math.max(1, Math.ceil(total / limit)), total });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/reviews/featured: reviews for the home page. Every live review
 * shows up here automatically, newest first; ones an admin pinned come first.
 * Also returns the summary of all public reviews for the "See all" link.
 */
export async function listFeaturedReviews(req, res, next) {
  try {
    if (!dbReady(res)) return;
    const limit = Math.min(Math.max(Number(req.query.limit) || 6, 1), 12);
    const scope = await publicScope();
    const [pinned, latest, summary] = await Promise.all([
      Review.find({ ...scope, featured: true }).sort({ approvedAt: -1, createdAt: -1 }).limit(limit).populate('medicine', 'name slug'),
      Review.find({ ...scope, featured: { $ne: true } }).sort({ createdAt: -1 }).limit(limit).populate('medicine', 'name slug'),
      summarise(scope),
    ]);
    const reviews = [...pinned, ...latest].slice(0, limit).map((r) => ({ ...toPublic(r), pinned: r.featured }));
    res.json({ reviews, summary });
  } catch (error) {
    next(error);
  }
}

const noLinks = (value) => {
  const text = String(value || '');
  if (EMAIL_IN_TEXT.test(text) || PHONE_IN_TEXT.test(text)) {
    throw new Error('Please remove phone numbers and email addresses from your review.');
  }
  if (LINK.test(text)) throw new Error('Please remove links from your review.');
  return true;
};

export const createReviewRules = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Please choose a rating from 1 to 5 stars.').toInt(),
  body('body')
    .isString()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Please write between 10 and 1000 characters.')
    .bail()
    .custom(noLinks),
  body('title').optional({ values: 'falsy' }).isString().trim().isLength({ max: 80 }).withMessage('Title can be up to 80 characters.').bail().custom(noLinks),
  body('name').isString().trim().isLength({ min: 2, max: 60 }).withMessage('Please enter your name (2 to 60 characters).').bail().custom(noLinks),
  body('country').optional({ values: 'falsy' }).isString().trim().isLength({ max: 60 }).withMessage('Country can be up to 60 characters.'),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('Please enter a valid email or leave it empty.').normalizeEmail({ gmail_remove_dots: false }),
  body('product').optional({ values: 'falsy' }).isString().trim().isLength({ max: 200 }),
  topicsRule('topics', { required: false }),
  body('assisted').optional().isBoolean().toBoolean(),
];

/** POST /api/reviews: published straight away; an admin can hide it later. */
export async function createReview(req, res, next) {
  try {
    if (handleValidation(req, res)) return;
    // Honeypot: people never see this field, form-filling bots do. Answer as if
    // it worked so the bot learns nothing, but keep nothing.
    if (req.body.website) return res.status(201).json({ message: THANK_YOU, status: 'approved' });
    if (!dbReady(res)) return;

    const { rating, title = '', body: text, name, country = '', email = '', product, topics = [], assisted = false } = req.body;
    let medicine = null;
    if (product) {
      medicine = await findPublicMedicine(product);
      if (!medicine) return res.status(404).json({ error: 'Product not found' });
    }

    if (email) {
      const already = await Review.exists({ email, medicine: medicine?._id ?? null, status: { $ne: 'rejected' } });
      if (already) {
        return res.status(409).json({
          error: medicine ? 'You have already reviewed this product. Thank you!' : 'You have already left a review. Thank you!',
        });
      }
    }

    const review = await Review.create({
      medicine: medicine?._id ?? null,
      rating,
      title,
      body: text,
      name,
      country,
      email,
      topics,
      assisted,
      status: 'approved',
      approvedAt: new Date(),
    });
    res.status(201).json({ message: THANK_YOU, status: 'approved', review: toPublic(review) });
  } catch (error) {
    next(error);
  }
}

export const suggestRules = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Please choose a star rating first.').toInt(),
  topicsRule('topics', { required: true }),
  body('product').optional({ values: 'falsy' }).isString().trim().isLength({ max: 200 }),
  body('notes').optional({ values: 'falsy' }).isString().trim().isLength({ max: 400 }).withMessage('Notes can be up to 400 characters.'),
];

/**
 * POST /api/reviews/suggest: draft reviews from the customer's rating and
 * topics (and their own notes, if any). Nothing is saved.
 */
export async function suggestReviews(req, res, next) {
  try {
    if (handleValidation(req, res)) return;
    const { rating, topics, product, notes = '' } = req.body;
    let productName = '';
    if (product && mongoose.connection.readyState === 1) {
      const medicine = await findPublicMedicine(product);
      if (!medicine) return res.status(404).json({ error: 'Product not found' });
      productName = medicine.name;
    }
    const result = await createReviewDrafts({ rating, topics, productName, notes });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------- admin

export const adminListRules = [
  query('status').optional().isIn([...REVIEW_STATUSES, 'all']),
  query('page').optional().isInt({ min: 1, max: 1000 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
];

/** GET /api/admin/reviews?status=all|approved|rejected|pending */
export async function adminListReviews(req, res, next) {
  try {
    if (handleValidation(req, res)) return;
    if (!dbReady(res)) return;
    const { status = 'all', page = 1, limit = 20 } = req.query;
    const filter = status === 'all' ? {} : { status };

    const [reviews, total, countRows, unseen] = await Promise.all([
      Review.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('medicine', 'name slug isPublished'),
      Review.countDocuments(filter),
      Review.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Review.countDocuments({ seenAt: null }),
    ]);
    const counts = { pending: 0, approved: 0, rejected: 0, unseen };
    for (const row of countRows) counts[row._id] = row.count;

    res.json({
      reviews: reviews.map((r) => ({
        id: String(r._id),
        rating: r.rating,
        title: r.title,
        body: r.body,
        name: r.name,
        country: r.country,
        email: r.email,
        topics: r.topics || [],
        assisted: Boolean(r.assisted),
        status: r.status,
        featured: r.featured,
        verifiedBuyer: r.verifiedBuyer,
        reply: r.reply,
        repliedAt: r.repliedAt,
        approvedAt: r.approvedAt,
        createdAt: r.createdAt,
        isNew: !r.seenAt,
        product: r.medicine ? { name: r.medicine.name, slug: r.medicine.slug, isPublished: r.medicine.isPublished !== false } : null,
      })),
      counts,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
      total,
    });
  } catch (error) {
    next(error);
  }
}

export const adminUpdateRules = [
  body('status').optional().isIn(REVIEW_STATUSES).withMessage('Unknown status'),
  body('featured').optional().isBoolean().withMessage('featured must be true or false').toBoolean(),
  body('verifiedBuyer').optional().isBoolean().withMessage('verifiedBuyer must be true or false').toBoolean(),
  body('reply').optional().isString().trim().isLength({ max: 1000 }).withMessage('Reply can be up to 1000 characters.'),
];

/** PATCH /api/admin/reviews/:id */
export async function adminUpdateReview(req, res, next) {
  try {
    if (handleValidation(req, res)) return;
    if (!dbReady(res)) return;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ error: 'Review not found' });

    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found' });

    const { status, featured, verifiedBuyer, reply } = req.body;
    if (status && status !== review.status) {
      review.status = status;
      if (status === 'approved') review.approvedAt = new Date();
    }
    if (typeof verifiedBuyer === 'boolean') review.verifiedBuyer = verifiedBuyer;
    if (typeof reply === 'string' && reply !== review.reply) {
      review.reply = reply;
      review.repliedAt = reply ? new Date() : null;
    }
    if (typeof featured === 'boolean') {
      if (featured && review.status !== 'approved') {
        return res.status(400).json({ error: 'Approve the review before featuring it.' });
      }
      review.featured = featured;
    }
    // Only approved reviews can stay featured.
    if (review.status !== 'approved') review.featured = false;

    await review.save();
    res.json({ id: String(review._id), status: review.status, featured: review.featured, verifiedBuyer: review.verifiedBuyer, reply: review.reply, repliedAt: review.repliedAt });
  } catch (error) {
    next(error);
  }
}

/** POST /api/admin/reviews/mark-seen: clears the "new" badge once the admin has looked. */
export async function adminMarkReviewsSeen(req, res, next) {
  try {
    if (!dbReady(res)) return;
    const result = await Review.updateMany({ seenAt: null }, { $set: { seenAt: new Date() } });
    res.json({ updated: result.modifiedCount });
  } catch (error) {
    next(error);
  }
}

/** DELETE /api/admin/reviews/:id */
export async function adminDeleteReview(req, res, next) {
  try {
    if (!dbReady(res)) return;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ error: 'Review not found' });
    const deleted = await Review.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Review not found' });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}
