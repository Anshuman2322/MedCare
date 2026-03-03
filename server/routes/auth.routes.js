import { Router } from 'express';
import { body } from 'express-validator';
import { registerAdmin, loginAdmin, logoutAdmin, getCurrentAdmin, bootstrapSuperAdmin } from '../controllers/auth.controller.js';
import { protectAdmin } from '../middleware/auth.middleware.js';

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

router.post('/register', [emailRules, passwordRules], registerAdmin);
router.post('/login', [emailRules, body('password').exists({ checkFalsy: true }).withMessage('Password is required')], loginAdmin);
router.post('/logout', logoutAdmin);
router.get('/me', protectAdmin, getCurrentAdmin);
router.post(
  '/bootstrap',
  [
    emailRules,
    body('password')
      .isLength({ min: 8 })
      .matches(/[A-Z]/)
      .matches(/[a-z]/)
      .matches(/[0-9]/)
      .matches(/[^A-Za-z0-9]/)
      .withMessage('Password must include uppercase, lowercase, number and special character'),
  ],
  bootstrapSuperAdmin
);

export default router;
