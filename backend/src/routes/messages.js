const router = require('express').Router();
const Message = require('../models/Message');
const Comment = require('../models/Comment');
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(auth);

// Messages flow
router.get('/messages', async (req, res) => {
  try {
    const { platform, pageId, page = 1, limit = 50 } = req.query;
    const query = { userId: req.user._id };
    if (platform) query.platform = platform;
    if (pageId) query.pageId = pageId;
    const messages = await Message.find(query).sort('-createdAt').skip((page - 1) * limit).limit(Number(limit));
    const total = await Message.countDocuments(query);
    res.json({ messages, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Comments flow
router.get('/comments', async (req, res) => {
  try {
    const { platform, pageId, postId, page = 1, limit = 50 } = req.query;
    const query = { userId: req.user._id };
    if (platform) query.platform = platform;
    if (pageId) query.pageId = pageId;
    if (postId) query.postId = postId;
    const comments = await Comment.find(query).sort('-createdAt').skip((page - 1) * limit).limit(Number(limit));
    const total = await Comment.countDocuments(query);
    res.json({ comments, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send manual message
router.post('/send', upload.single('image'), async (req, res) => {
  try {
    const { platform, pageId, recipientId, content, delay } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
    const Page = require('../models/Page');
    const page = await Page.findOne({ _id: pageId, userId: req.user._id });
    if (!page) return res.status(404).json({ error: 'Page not found' });

    const msg = await Message.create({
      userId: req.user._id, pageId, platform, type: 'outgoing',
      recipientId, content, imageUrl, isAutoReply: false,
      scheduledAt: delay ? new Date(Date.now() + delay * 1000) : undefined,
      status: 'pending'
    });

    const AutoReplyService = require('../services/autoReplyService');
    if (!delay) {
      await AutoReplyService.sendMessage(page, recipientId, content, imageUrl);
      msg.status = 'sent'; msg.sentAt = new Date(); await msg.save();
    }
    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
