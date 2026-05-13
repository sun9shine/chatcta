const router = require('express').Router();
const Conversion = require('../models/Conversion');
const { auth } = require('../middleware/auth');

router.use(auth);

// Get conversions overview
router.get('/', async (req, res) => {
  try {
    const { botId, platform, from, to } = req.query;
    const q = { userId: req.user._id };
    if (botId) q.botId = botId;
    if (platform) q.platform = platform;
    if (from || to) {
      q.createdAt = {};
      if (from) q.createdAt.$gte = new Date(from);
      if (to) q.createdAt.$lte = new Date(to);
    }
    const conversions = await Conversion.find(q).sort('-createdAt').limit(200);
    const total = await Conversion.countDocuments(q);
    const totalValue = await Conversion.aggregate([
      { $match: q },
      { $group: { _id: null, sum: { $sum: '$eventValue' } } }
    ]);
    res.json({ conversions, total, totalValue: totalValue[0]?.sum || 0 });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get conversions by bot
router.get('/by-bot', async (req, res) => {
  try {
    const data = await Conversion.aggregate([
      { $match: { userId: req.user._id } },
      { $group: { _id: '$botId', count: { $sum: 1 }, value: { $sum: '$eventValue' } } },
      { $lookup: { from: 'bots', localField: '_id', foreignField: '_id', as: 'bot' } },
      { $unwind: { path: '$bot', preserveNullAndEmptyArrays: true } },
      { $sort: { count: -1 } }
    ]);
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Track a conversion (webhook-style, no auth, uses trackingId)
router.post('/track', async (req, res) => {
  try {
    const { trackingId, eventType, eventValue, metadata } = req.body;
    if (!trackingId) return res.status(400).json({ error: 'trackingId required' });

    // Find existing conversion by trackingId and update
    const existing = await Conversion.findOne({ trackingId });
    if (existing) {
      existing.eventType = eventType || existing.eventType;
      existing.eventValue = eventValue || existing.eventValue;
      existing.metadata = { ...existing.metadata, ...metadata };
      await existing.save();
      return res.json({ updated: true });
    }
    res.json({ tracked: false, message: 'Tracking ID not found' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Daily conversion stats
router.get('/daily', async (req, res) => {
  try {
    const days = Number(req.query.days) || 30;
    const since = new Date(Date.now() - days * 24 * 3600 * 1000);
    const data = await Conversion.aggregate([
      { $match: { userId: req.user._id, createdAt: { $gte: since } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 }, value: { $sum: '$eventValue' }
      }},
      { $sort: { _id: 1 } }
    ]);
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
