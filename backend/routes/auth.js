const express    = require('express');
const router     = express.Router();
const { body }   = require('express-validator');
const rateLimit  = require('express-rate-limit');
const { protect } = require('../middleware/auth');
const {
  register, login, getMe,
  refreshToken, logout,
  forgotPassword, verifyOTP, resetPassword,
  changePassword,
} = require('../controllers/authController');

// ── Rate limiters ────────────────────────────────────────────────

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10,
  message: { success: false, message: 'Too many attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { success: false, message: 'Too many OTP requests. Please try again in 1 hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Validation chains ────────────────────────────────────────────

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }).withMessage('Name too long'),
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/\d/).withMessage('Password must contain at least one number'),
  body('role').optional().isIn(['patient', 'doctor']).withMessage('Invalid role'),
  body('age').optional({ checkFalsy: true }).isInt({ min: 0, max: 150 }).withMessage('Invalid age'),
  body('phone').optional({ checkFalsy: true }).trim().isLength({ max: 20 }).withMessage('Phone too long'),
];

const loginRules = [
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

// ── Routes ───────────────────────────────────────────────────────

router.post('/register', authLimiter, registerRules, register);
router.post('/login',    authLimiter, loginRules,    login);
router.get('/me',        protect, getMe);

// Token management
router.post('/refresh', refreshToken);
router.post('/logout',  protect, logout);

// Password reset flow
router.post('/forgot-password', otpLimiter, forgotPassword);
router.post('/verify-otp',      otpLimiter, verifyOTP);
router.post('/reset-password',  authLimiter, resetPassword);

// Authenticated password change
router.post('/change-password', protect, changePassword);

module.exports = router;
