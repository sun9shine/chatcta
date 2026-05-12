const router = require('express').Router();
const Message = require('../models/Message');
const Comment = require('../models/Comment');
const Page = require('../models/Page');
const Bot = require('../models/Bot');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/overview', async (req, res) => {
  try {
    const userId = req.user._id;
    const [totalMessages, totalComments, autoReplies, autoMessages, activeBots, pages] = await Promise.all([
      Message.countDocuments({ userId }),
      Comment.countDocuments({ userId }),
      Comment.countDocuments({ userId, 'reply.sent': true }),
      Message.countDocuments({ userId, isAutoReply: true }),
      Bot.countDocuments({ userId, isActive: true }),
      Page.countDocuments({ userId, isActive: true })
    ]);

    // Daily stats last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    const dailyMessages = await Message.aggregate([
      { $match: { userId, createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    const dailyComments = await Comment.aggregate([
      { $match: { userId, createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    res.json({ totalMessages, totalComments, autoReplies, autoMessages, activeBots, pages, dailyMessages, dailyComments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
