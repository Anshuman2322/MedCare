import { Router } from 'express';
import { createInquiry, createBulkRequest } from '../controllers/inquiryController.js';

const router = Router();

router.post('/', createInquiry);
// Cart-based inquiries and best-price requests (one or many medicines).
router.post('/bulk', createBulkRequest);

export default router;
