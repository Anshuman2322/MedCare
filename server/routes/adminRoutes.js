import { Router } from 'express';
import { body } from 'express-validator';
import { getDashboardStats } from '../controllers/adminController.js';
import { getCategoriesWithCount } from '../controllers/categoryController.js';
import { getAllMedicinesForAdmin, getMedicineBySlugForAdmin } from '../controllers/medicineController.js';
import { listAdmins, createAdmin, deleteAdmin, transferOwnership, updateAdminRole } from '../controllers/adminUser.controller.js';
import { listAdminInquiries, updateInquiryStatus } from '../controllers/adminInquiry.controller.js';
import { listContactMessages, markContactMessageRead } from '../controllers/contactController.js';
import {
	listConversations,
	getConversation,
	replyToConversation,
	updateConversationStatus,
	getChatSummary,
	getLiveChatSettings,
	updateLiveChatSettings,
	listQuickReplies,
	createQuickReply,
	updateQuickReply,
	deleteQuickReply,
} from '../controllers/adminChat.controller.js';
import {
	adminListReviews,
	adminListRules,
	adminUpdateReview,
	adminUpdateRules,
	adminDeleteReview,
	adminMarkReviewsSeen,
} from '../controllers/review.controller.js';
import { protectAdmin, requireRole, requirePermission } from '../middleware/auth.middleware.js';

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
router.put('/admins/:id/role', protectAdmin, requireRole('super_admin'), updateAdminRole);

router.get('/dashboard', protectAdmin, requirePermission('dashboard'), getDashboardStats);
router.get('/categories/with-count', protectAdmin, requirePermission('categories'), getCategoriesWithCount);
// The public /api/medicines routes leave out unpublished products.
router.get('/medicines', protectAdmin, requirePermission('medicines'), getAllMedicinesForAdmin);
router.get('/medicines/:slug', protectAdmin, requirePermission('medicines'), getMedicineBySlugForAdmin);
router.get('/inquiries', protectAdmin, requirePermission('inquiries'), requireRole('admin', 'super_admin'), listAdminInquiries);
router.put(
	'/inquiries/:id/status',
	protectAdmin,
	requirePermission('inquiries'),
	requireRole('admin', 'super_admin'),
	body('status').isString().trim(),
	updateInquiryStatus
);

const chatGuards = [protectAdmin, requirePermission('inquiries'), requireRole('admin', 'super_admin')];

router.get('/chat/conversations', chatGuards, listConversations);
router.get('/chat/conversations/:id', chatGuards, getConversation);
router.post('/chat/conversations/:id/reply', chatGuards, body('text').isString().trim(), replyToConversation);
router.put('/chat/conversations/:id/status', chatGuards, body('status').isString().trim(), updateConversationStatus);
router.get('/chat/summary', chatGuards, getChatSummary);
router.get('/chat/settings', chatGuards, getLiveChatSettings);
router.put('/chat/settings', chatGuards, updateLiveChatSettings);
router.get('/chat/quick-replies', chatGuards, listQuickReplies);
router.post('/chat/quick-replies', chatGuards, createQuickReply);
router.put('/chat/quick-replies/:id', chatGuards, updateQuickReply);
router.delete('/chat/quick-replies/:id', chatGuards, deleteQuickReply);

// Customer reviews are customer communication, so they share the inquiries permission.
router.get('/reviews', chatGuards, adminListRules, adminListReviews);
router.post('/reviews/mark-seen', chatGuards, adminMarkReviewsSeen);
router.patch('/reviews/:id', chatGuards, adminUpdateRules, adminUpdateReview);
router.delete('/reviews/:id', chatGuards, adminDeleteReview);

router.get('/contact-messages', protectAdmin, requirePermission('inquiries'), requireRole('admin', 'super_admin'), listContactMessages);
router.put('/contact-messages/:id/read', protectAdmin, requirePermission('inquiries'), requireRole('admin', 'super_admin'), markContactMessageRead);

export default router;
