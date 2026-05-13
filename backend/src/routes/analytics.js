const router = require('express').Router();
const Message = require('../models/Message');
const Comment = require('../models/Comment');
const Page = require('../models/Page');
const Bot = require('../models/Bot');
const Conversion = require('../models/Conversion');
const { auth } = require('../middleware/auth');

router.use(auth);

// Main overview
router.get('/overview', async (req, res) => {
  try {
    const userId = req.user._id;
    const [totalMessages, totalComments, autoReplies, autoMessages, activeBots, pages, totalConversions] = await Promise.all([
      Message.countDocuments({ userId }),
      Comment.countDocuments({ userId }),
      Comment.countDocuments({ userId, 'reply.sent': true }),
      Message.countDocuments({ userId, isAutoReply: true }),
      Bot.countDocuments({ userId, isActive: true }),
      Page.countDocuments({ userId, isActive: true }),
      Conversion.countDocuments({ userId })
    ]);

    const totalValue = await Conversion.aggregate([
      { $match: { userId } },
      { $group: { _id: null, sum: { $sum: '$eventValue' } } }
    ]);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    const [dailyMessages, dailyComments, dailyConversions] = await Promise.all([
      Message.aggregate([
        { $match: { userId, createdAt: { $gte: sevenDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Comment.aggregate([
        { $match: { userId, createdAt: { $gte: sevenDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Conversion.aggregate([
        { $match: { userId, createdAt: { $gte: sevenDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 }, value: { $sum: '$eventValue' } } },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.json({
      totalMessages, totalComments, autoReplies, autoMessages,
      activeBots, pages, totalConversions,
      totalValue: totalValue[0]?.sum || 0,
      dailyMessages, dailyComments, dailyConversions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Per-bot analytics
router.get('/bots', async (req, res) => {
  try {
    const userId = req.user._id;
    const bots = await Bot.find({ userId });

    const data = await Promise.all(bots.map(async bot => {
      const [replies, dms, convs] = await Promise.all([
        Comment.countDocuments({ userId, 'reply.botId': bot._id, 'reply.sent': true }),
        Message.countDocuments({ userId, botId: bot._id, isAutoReply: true }),
        Conversion.countDocuments({ userId, botId: bot._id })
      ]);
      const convValue = await Conversion.aggregate([
        { $match: { userId, botId: bot._id } },
        { $group: { _id: null, sum: { $sum: '$eventValue' } } }
      ]);
      return {
        botId: bot._id,
        name: bot.name,
        platform: bot.platform,
        type: bot.type,
        isActive: bot.isActive,
        replies, dms, conversions: convs,
        conversionValue: convValue[0]?.sum || 0,
        lastRun: bot.stats?.lastRun
      };
    }));

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Per-page analytics
router.get('/pages', async (req, res) => {
  try {
    const userId = req.user._id;
    const pages = await Page.find({ userId });

    const data = await Promise.all(pages.map(async page => {
      const [inMessages, outMessages, comments, replied] = await Promise.all([
        Message.countDocuments({ userId, pageId: page._id, type: 'incoming' }),
        Message.countDocuments({ userId, pageId: page._id, type: 'outgoing' }),
        Comment.countDocuments({ userId, pageId: page._id }),
        Comment.countDocuments({ userId, pageId: page._id, 'reply.sent': true })
      ]);
      return {
        pageId: page._id,
        pageName: page.pageName,
        platform: page.platform,
        isActive: page.isActive,
        followers: page.followers,
        inMessages, outMessages, comments, replied,
        replyRate: comments > 0 ? Math.round((replied / comments) * 100) : 0
      };
    }));

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Platform breakdown
router.get('/platforms', async (req, res) => {
  try {
    const userId = req.user._id;
    const platforms = ['facebook', 'instagram', 'whatsapp', 'telegram', 'tiktok'];

    const data = await Promise.all(platforms.map(async platform => {
      const [messages, comments, pages] = await Promise.all([
        Message.countDocuments({ userId, platform }),
        Comment.countDocuments({ userId, platform }),
        Page.countDocuments({ userId, platform, isActive: true })
      ]);
      return { platform, messages, comments, pages };
    }));

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Growth stats (30/60/90 days)
router.get('/growth', async (req, res) => {
  try {
    const userId = req.user._id;
    const days = Number(req.query.days) || 30;
    const since = new Date(Date.now() - days * 24 * 3600 * 1000);

    const [msgGrowth, commentGrowth, convGrowth] = await Promise.all([
      Message.aggregate([
        { $match: { userId, createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Comment.aggregate([
        { $match: { userId, createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Conversion.aggregate([
        { $match: { userId, createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 }, value: { $sum: '$eventValue' } } },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.json({ msgGrowth, commentGrowth, convGrowth, days });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
