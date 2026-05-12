const router = require('express').Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Page = require('../models/Page');
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Get profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -resetPasswordToken -resetPasswordExpires');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update profile
router.put('/profile', auth, upload.single('avatar'), async (req, res) => {
  try {
    const { name, phone, language } = req.body;
    const update = { name, phone, language };
    if (req.file) update.avatar = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete own account
router.delete('/account', auth, async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user._id);
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Password incorrect' });
    await Page.deleteMany({ userId: req.user._id });
    await User.findByIdAndDelete(req.user._id);
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get connected pages
router.get('/pages', auth, async (req, res) => {
  try {
    const pages = await Page.find({ userId: req.user._id });
    res.json(pages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get dashboard stats
router.get('/stats', auth, async (req, res) => {
  try {
    const Message = require('../models/Message');
    const Comment = require('../models/Comment');
    const Bot = require('../models/Bot');
    const [pages, bots, messages, comments] = await Promise.all([
      Page.countDocuments({ userId: req.user._id }),
      Bot.countDocuments({ userId: req.user._id }),
      Message.countDocuments({ userId: req.user._id, isAutoReply: true }),
      Comment.countDocuments({ userId: req.user._id, 'reply.sent': true })
    ]);
    res.json({ pages, bots, autoMessages: messages, autoComments: comments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
