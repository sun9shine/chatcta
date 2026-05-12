const router = require('express').Router();
const Announcement = require('../models/Announcement');
const { auth, adminOnly } = require('../middleware/auth');

// User: get active announcements
router.get('/', auth, async (req, res) => {
  try {
    const now = new Date();
    const announcements = await Announcement.find({
      isActive: true,
      $and: [
        { $or: [{ expiresAt: { $gt: now } }, { expiresAt: null }] },
        { $or: [{ targetAll: true }, { targetUsers: req.user._id }] }
      ]
    }).sort('-createdAt');
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// User: mark as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    await Announcement.findByIdAndUpdate(req.params.id, { $addToSet: { readBy: req.user._id } });
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: CRUD
router.get('/admin/all', auth, adminOnly, async (req, res) => {
  try {
    const announcements = await Announcement.find().sort('-createdAt');
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const ann = await Announcement.create({ ...req.body, createdBy: req.user._id });
    if (global.io) global.io.emit('announcement', ann);
    res.status(201).json(ann);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const ann = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(ann);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
