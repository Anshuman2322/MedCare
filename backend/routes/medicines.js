import { Router } from 'express';
import {
  listMedicines,
  getMedicine,
  listCategories,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  addImagesToMedicine,
  removeImageFromMedicine
} from '../controllers/medicinesController.js';
import { uploadImages } from '../middlewares/uploadMiddleware.js';

const router = Router();

router.get('/medicines', listMedicines);
router.get('/medicines/:id', getMedicine);
router.get('/categories', listCategories);
router.post('/medicines', uploadImages.array('images', 20), createMedicine);
router.put('/medicines/:id', uploadImages.array('images', 20), updateMedicine);
router.delete('/medicines/:id', deleteMedicine);

// Image ops for an existing medicine
router.post('/medicines/:id/images', uploadImages.array('images', 20), addImagesToMedicine);
router.delete('/medicines/:id/images', removeImageFromMedicine);

export default router;
