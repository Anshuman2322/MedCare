import { Router } from 'express';
import { uploadImages } from '../middlewares/uploadMiddleware.js';
import { addImagesToMedicine, removeImageFromMedicine } from '../controllers/uploadController.js';

const router = Router();

router.post('/medicines/:id/upload', uploadImages.array('images', 20), addImagesToMedicine);
router.delete('/medicines/:id/upload', removeImageFromMedicine);

export default router;
