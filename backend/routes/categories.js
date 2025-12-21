import { Router } from 'express';
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoriesController.js';

const router = Router();

router.get('/categories', listCategories);
router.post('/categories', createCategory);
router.put('/categories', updateCategory);
router.delete('/categories', deleteCategory);

export default router;
