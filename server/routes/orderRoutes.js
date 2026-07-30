import { Router } from 'express';
import { createOrder, listOrders } from '../controllers/orderController.js';
import { protectAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/', createOrder);
// Exposes customer PII (name/email/phone) — admin-only.
router.get('/', protectAdmin, listOrders);

export default router;
