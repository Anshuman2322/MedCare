import { Router } from 'express';
import { getDashboardStats } from '../controllers/adminController.js';
import { getCategoriesWithCount } from '../controllers/categoryController.js';

const router = Router();

router.get('/dashboard', getDashboardStats);
router.get('/categories/with-count', getCategoriesWithCount);

export default router;
