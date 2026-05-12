const router = require('express').Router();
const SupportMessage = require('../models/SupportMessage');
const User = require('../models/User');
const { auth, adminOnly } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

router.use(auth);

// Get user's support messages
router.get('/', async (req, res) => {
  try {
    const messages = await SupportMessage.find({
      $or: [{ from: req.user._id }, { to: req.user._id }]
    }).populate('from', 'name email avatar').populate('to', 'name email avatar').sort('createdAt');
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send message to admin
router.post('/', async (req, res) => {
  try {
    const admin = await User.findOne({ role: 'admin' });
    const threadId = req.body.threadId || uuidv4();
    const msg = await SupportMessage.create({
      from: req.user._id,
      to: admin?._id,
      content: req.body.content,
      subject: req.body.subject,
      threadId,
      isAdminReply: false
    });
    if (global.io) global.io.to(admin?._id?.toString()).emit('support_message', msg);
    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: get all support messages
router.get('/admin/all', adminOnly, async (req, res) => {
  try {
    const messages = await SupportMessage.find()
      .populate('from', 'name email avatar')
      .populate('to', 'name email avatar')
      .sort('-createdAt');
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: reply
router.post('/admin/reply', adminOnly, async (req, res) => {
  try {
    const msg = await SupportMessage.create({
      from: req.user._id,
      to: req.body.userId,
      content: req.body.content,
      threadId: req.body.threadId,
      isAdminReply: true,
      parentId: req.body.parentId
    });
    if (global.io) global.io.to(req.body.userId).emit('support_message', msg);
    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark as read
router.put('/:id/read', async (req, res) => {
  try {
    await SupportMessage.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
