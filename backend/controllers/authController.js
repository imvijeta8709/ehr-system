const User   = require('../models/User');
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const { sendWelcomeEmail, sendOTPEmail } = require('../utils/mailer');

// ── Token helpers ────────────────────────────────────────────────

const signAccess = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '15m',
  });

const signRefresh = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
  });

const hashOTP = (otp) =>
  crypto.createHash('sha256').update(String(otp)).digest('hex');

// ── Register ─────────────────────────────────────────────────────

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, errors: errors.array() });
  try {
    const { name, email, password, role, age, gender, phone, address, bloodGroup, specialization, licenseNumber } = req.body;
    if (await User.findOne({ email }))
      return res.status(400).json({ success: false, message: 'Email already registered' });
    const optional = { age, gender, phone, address, bloodGroup, specialization, licenseNumber };
    const filtered = Object.fromEntries(Object.entries(optional).filter(([, v]) => v !== '' && v != null));
    const user = await User.create({ name, email, password, role: role || 'patient', ...filtered });
    sendWelcomeEmail(user.email, user.name).catch(console.error);
    const accessToken  = signAccess(user._id);
    const refreshToken = signRefresh(user._id);
    user.refreshToken  = refreshToken;
    await user.save({ validateBeforeSave: false });
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.refreshToken;
    res.status(201).json({
      success: true,
      token: accessToken,
      refreshToken,
      user: userObj,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// ── Login ────────────────────────────────────────────────────────

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, errors: errors.array() });
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    // Brute-force lock check
    if (user && user.lockUntil && user.lockUntil > Date.now()) {
      const mins = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(429).json({ success: false, message: `Account locked. Try again in ${mins} minute(s).` });
    }
    if (!user || !(await user.matchPassword(password))) {
      if (user) {
        user.loginAttempts = (user.loginAttempts || 0) + 1;
        if (user.loginAttempts >= 5) {
          user.lockUntil     = new Date(Date.now() + 15 * 60 * 1000);
          user.loginAttempts = 0;
        }
        await user.save({ validateBeforeSave: false });
      }
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (!user.isActive)
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    user.loginAttempts = 0;
    user.lockUntil     = null;
    const accessToken  = signAccess(user._id);
    const refreshToken = signRefresh(user._id);
    user.refreshToken  = refreshToken;
    await user.save({ validateBeforeSave: false });
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.refreshToken;
    res.json({
      success: true,
      token: accessToken,
      refreshToken,
      user: userObj,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Get Me ───────────────────────────────────────────────────────

exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// ── Refresh Token ────────────────────────────────────────────────

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(400).json({ success: false, message: 'Refresh token required' });
    const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
    let decoded;
    try { decoded = jwt.verify(refreshToken, secret); }
    catch { return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' }); }
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken)
      return res.status(401).json({ success: false, message: 'Refresh token revoked' });
    const newAccess  = signAccess(user._id);
    const newRefresh = signRefresh(user._id);
    user.refreshToken = newRefresh;
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, token: newAccess, refreshToken: newRefresh });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Logout ───────────────────────────────────────────────────────

exports.logout = async (req, res) => {
  try {
    req.user.refreshToken = null;
    await req.user.save({ validateBeforeSave: false });
    res.json({ success: true, message: 'Logged out' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// ── Forgot Password ──────────────────────────────────────────────

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ success: false, message: 'Email is required' });
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user)
      return res.json({ success: true, message: 'If that email exists, an OTP has been sent.' });
    const otp    = String(Math.floor(100000 + Math.random() * 900000));
    user.passwordResetOTP = hashOTP(otp);
    user.otpExpiry        = new Date(Date.now() + 10 * 60 * 1000);
    user.otpAttempts      = 0;
    await user.save({ validateBeforeSave: false });
    await sendOTPEmail(user.email, user.name, otp).catch(console.error);
    res.json({ success: true, message: 'If that email exists, an OTP has been sent.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Verify OTP ───────────────────────────────────────────────────

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.passwordResetOTP)
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    if (user.otpExpiry < Date.now())
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    if ((user.otpAttempts || 0) >= 5)
      return res.status(429).json({ success: false, message: 'Too many attempts. Please request a new OTP.' });
    if (user.passwordResetOTP !== hashOTP(otp)) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      await user.save({ validateBeforeSave: false });
      return res.status(400).json({ success: false, message: 'Incorrect OTP' });
    }
    const resetToken = jwt.sign(
      { id: user._id, purpose: 'reset' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );
    res.json({ success: true, resetToken });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Reset Password ───────────────────────────────────────────────

exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, password } = req.body;
    if (!resetToken || !password)
      return res.status(400).json({ success: false, message: 'Reset token and new password are required' });
    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    let decoded;
    try { decoded = jwt.verify(resetToken, process.env.JWT_SECRET); }
    catch { return res.status(400).json({ success: false, message: 'Reset token is invalid or expired' }); }
    if (decoded.purpose !== 'reset')
      return res.status(400).json({ success: false, message: 'Invalid token purpose' });
    const user = await User.findById(decoded.id);
    if (!user)
      return res.status(404).json({ success: false, message: 'User not found' });
    user.password         = password;
    user.passwordResetOTP = null;
    user.otpExpiry        = null;
    user.otpAttempts      = 0;
    user.refreshToken     = null;
    await user.save();
    res.json({ success: true, message: 'Password reset successfully. Please log in.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Change Password ──────────────────────────────────────────────

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ success: false, message: 'Both current and new password are required' });
    if (newPassword.length < 6)
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    const user = await User.findById(req.user._id);
    if (!(await user.matchPassword(currentPassword)))
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
