const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const SmtpConfig = require('../models/SmtpConfig');
const nodemailer = require('nodemailer');
const { auth } = require('../middleware/auth');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'chatcta_secret_2024', { expiresIn: '7d' });

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, language } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'Email already registered' });
    const hash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hash, phone, language: language || 'ar', isVerified: true });
    const token = signToken(user._id);
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, language: user.language } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    if (user.isBanned) return res.status(403).json({ error: 'Account banned: ' + (user.banReason || '') });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid credentials' });
    user.lastLogin = new Date();
    await user.save();
    const token = signToken(user._id);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, language: user.language, avatar: user.avatar } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  res.json(req.user);
});

// Forgot password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.json({ message: 'If email exists, reset link sent' });
    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    const smtpConf = await SmtpConfig.findOne({ isActive: true });
    if (smtpConf) {
      const transporter = nodemailer.createTransport({
        host: smtpConf.host, port: smtpConf.port, secure: smtpConf.secure,
        auth: { user: smtpConf.user, pass: smtpConf.password }
      });
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${token}`;
      await transporter.sendMail({
        from: `"${smtpConf.fromName}" <${smtpConf.fromEmail || smtpConf.user}>`,
        to: email,
        subject: 'Password Reset - ChatCTA',
        html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. Link expires in 1 hour.</p>`
      });
    }
    res.json({ message: 'If email exists, reset link sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset password
router.post('/reset-password/:token', async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    if (!user) return res.status(400).json({ error: 'Invalid or expired token' });
    user.password = await bcrypt.hash(req.body.password, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Change password (authenticated)
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(400).json({ error: 'Current password incorrect' });
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Data deletion request (public - no auth needed)
router.post('/request-deletion', async (req, res) => {
  try {
    const { email, reason } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    // Log the request (admin can see in support messages)
    const SupportMessage = require('../models/SupportMessage');
    const user = await User.findOne({ email });
    if (user) {
      const admin = await User.findOne({ role: 'admin' });
      await SupportMessage.create({
        from: user._id,
        to: admin?._id,
        subject: 'Data Deletion Request',
        content: `User requested account deletion.\nEmail: ${email}\nReason: ${reason || 'Not provided'}`,
        isAdminReply: false
      });
    }
    // Always return success (don't reveal if email exists)
    res.json({ message: 'Deletion request received. Will be processed within 30 days.' });
  } catch (err) {
    res.json({ message: 'Deletion request received.' });
  }
});

module.exports = router;
