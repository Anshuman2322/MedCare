import { Router } from 'express';
import { body } from 'express-validator';
import { getDashboardStats } from '../controllers/adminController.js';
import { getCategoriesWithCount } from '../controllers/categoryController.js';
import { listAdmins, createAdmin, deleteAdmin, transferOwnership } from '../controllers/adminUser.controller.js';
import { listAdminInquiries, updateInquiryStatus } from '../controllers/adminInquiry.controller.js';
import { protectAdmin, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

const passwordRules = body('password')
	.exists({ checkFalsy: true })
	.withMessage('Password is required')
	.isLength({ min: 8 })
	.withMessage('Password must be at least 8 characters long')
	.matches(/[A-Z]/)
	.withMessage('Password must include at least one uppercase letter')
	.matches(/[a-z]/)
	.withMessage('Password must include at least one lowercase letter')
	.matches(/[0-9]/)
	.withMessage('Password must include at least one number')
	.matches(/[^A-Za-z0-9\s]/)
	.withMessage('Password must include at least one special character')
	.matches(/^\S+$/)
	.withMessage('Password cannot contain spaces');

const emailRules = body('email')
	.exists({ checkFalsy: true })
	.withMessage('Email is required')
	.isEmail()
	.withMessage('Email must be valid')
	.normalizeEmail({ gmail_remove_dots: false, all_lowercase: true });

router.get('/admins', protectAdmin, requireRole('super_admin'), listAdmins);
router.post('/admins', protectAdmin, requireRole('super_admin'), [emailRules, passwordRules], createAdmin);
router.post('/create', protectAdmin, requireRole('super_admin'), [emailRules, passwordRules], createAdmin);
router.delete('/admins/:id', protectAdmin, requireRole('super_admin'), deleteAdmin);
router.post('/admins/transfer-ownership', protectAdmin, requireRole('super_admin'), transferOwnership);

router.get('/dashboard', protectAdmin, getDashboardStats);
router.get('/categories/with-count', protectAdmin, getCategoriesWithCount);
router.get('/inquiries', protectAdmin, requireRole('admin', 'super_admin'), listAdminInquiries);
router.put(
	'/inquiries/:id/status',
	protectAdmin,
	requireRole('admin', 'super_admin'),
	body('status').isString().trim(),
	updateInquiryStatus
);

export default router;
