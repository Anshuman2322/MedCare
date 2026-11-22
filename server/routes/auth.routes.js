import { Router } from 'express';
import { body } from 'express-validator';
import { registerAdmin, loginAdmin, logoutAdmin, getCurrentAdmin, bootstrapSuperAdmin } from '../controllers/auth.controller.js';
import { forgotPassword, verifyResetOtp, resetPassword } from '../controllers/passwordReset.controller.js';
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
router.post('/forgot-password', [emailRules], forgotPassword);
router.post(
  '/verify-reset-otp',
  [
    emailRules,
    body('otp').isString().matches(/^\d{6}$/).withMessage('Enter the 6-digit code from your email'),
  ],
  verifyResetOtp
);
router.post(
  '/reset-password',
  [
    body('resetToken').isString().isHexadecimal().isLength({ min: 64, max: 64 }).withMessage('Invalid reset session'),
    passwordRules,
    // bcrypt silently ignores everything past 72 bytes.
    body('password').isLength({ max: 72 }).withMessage('Password must be 72 characters or fewer'),
    // The Admin pre-save hook stores anything shaped like a bcrypt hash as-is,
    // which would keep this value in plain text.
    body('password').not().matches(/^\$2[ab]\$/).withMessage('Password cannot start with that sequence'),
  ],
  resetPassword
);
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
