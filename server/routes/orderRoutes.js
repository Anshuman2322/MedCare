import { Router } from 'express';
import { createOrder, listOrders } from '../controllers/orderController.js';

const router = Router();

router.post('/', createOrder);
router.get('/', listOrders);

export default router;
