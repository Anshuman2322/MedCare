import { Router } from 'express';
import {
	createMedicine,
	getAllMedicines,
	getMedicineBySlug,
	updateMedicineById,
	deleteMedicineById,
} from '../controllers/medicineController.js';
import { protectAdmin, requirePermission } from '../middleware/auth.middleware.js';

const router = Router();

// JSON-based medicine CRUD; images are Cloudinary URLs only
router.post('/', protectAdmin, requirePermission('medicines'), createMedicine);
router.get('/', getAllMedicines);
router.get('/:slug', getMedicineBySlug);
router.put('/:id', protectAdmin, requirePermission('medicines'), updateMedicineById);
router.delete('/:id', protectAdmin, requirePermission('medicines'), deleteMedicineById);

export default router;
