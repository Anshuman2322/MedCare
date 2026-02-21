import { Router } from 'express';
import {
	createMedicine,
	getAllMedicines,
	getMedicineBySlug,
	updateMedicineById,
	deleteMedicineById,
} from '../controllers/medicineController.js';

const router = Router();

// JSON-based medicine CRUD; images are Cloudinary URLs only
router.post('/', createMedicine);
router.get('/', getAllMedicines);
router.get('/:slug', getMedicineBySlug);
router.put('/:id', updateMedicineById);
router.delete('/:id', deleteMedicineById);

export default router;
