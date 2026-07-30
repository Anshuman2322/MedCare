import { Router } from 'express';
import { createCategory, deleteCategory, getCategories } from '../controllers/categoryController.js';
import { protectAdmin, requirePermission } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', getCategories);
router.post('/', protectAdmin, requirePermission('categories'), createCategory);
router.delete('/:id', protectAdmin, requirePermission('categories'), deleteCategory);

export default router;
