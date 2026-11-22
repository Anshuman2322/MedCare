import { Router } from 'express';
import { listFaq, searchFaqRoute, voteFaq } from '../controllers/faq.controller.js';
import { requireDatabase } from '../middleware/requireDatabase.js';
import { faqVoteLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.get('/', listFaq);
router.get('/search', searchFaqRoute);
router.post('/:id/feedback', faqVoteLimiter, requireDatabase, voteFaq);

export default router;
