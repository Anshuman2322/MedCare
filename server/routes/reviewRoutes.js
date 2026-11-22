import { Router } from 'express';
import {
  listReviews,
  listReviewsRules,
  listFeaturedReviews,
  createReview,
  createReviewRules,
  suggestReviews,
  suggestRules,
} from '../controllers/review.controller.js';
import { reviewSubmitLimiter, reviewSuggestLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.get('/', listReviewsRules, listReviews);
router.get('/featured', listFeaturedReviews);
router.post('/suggest', reviewSuggestLimiter, suggestRules, suggestReviews);
router.post('/', reviewSubmitLimiter, createReviewRules, createReview);

export default router;
