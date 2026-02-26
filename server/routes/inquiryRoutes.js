import { Router } from 'express';
import { createInquiry, listInquiries } from '../controllers/inquiryController.js';

const router = Router();

router.post('/', createInquiry);
router.get('/', listInquiries);

export default router;
