const router = require('express').Router();
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const { auth, adminOnly } = require('../middleware/auth');

const PLANS = Subscription.schema?.statics?.PLANS || {};

// Get current user subscription
router.get('/my', auth, async (req, res) => {
  try {
    let sub = await Subscription.findOne({ userId: req.user._id });
    if (!sub) {
      sub = await Subscription.create({ userId: req.user._id, plan: 'free' });
    }
    res.json({ ...sub.toObject(), planDetails: PLANS[sub.plan] || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all plans info (public)
router.get('/plans', async (req, res) => {
  try {
    const SubscriptionModel = require('../models/Subscription');
    res.json(SubscriptionModel.schema.statics.PLANS);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin routes ──────────────────────────────────────
// Get all subscriptions
router.get('/admin/all', auth, adminOnly, async (req, res) => {
  try {
    const subs = await Subscription.find().populate('userId', 'name email phone plan');
    res.json(subs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin upgrade / downgrade user plan (FREE - no payment required)
router.put('/admin/upgrade/:userId', auth, adminOnly, async (req, res) => {
  try {
    const { plan, expiresAt, adminNote } = req.body;
    const validPlans = ['free', 'pro', 'enterprise'];
    if (!validPlans.includes(plan)) return res.status(400).json({ error: 'Invalid plan' });

    const sub = await Subscription.findOneAndUpdate(
      { userId: req.params.userId },
      {
        plan,
        status: 'active',
        upgradedByAdmin: true,
        upgradedBy: req.user._id,
        adminNote: adminNote || `Upgraded to ${plan} by admin`,
        startedAt: new Date(),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      { upsert: true, new: true }
    );

    // Sync plan field on User for quick access
    await User.findByIdAndUpdate(req.params.userId, {
      plan,
      planExpiresAt: expiresAt ? new Date(expiresAt) : null
    });

    // Notify user via socket
    if (global.io) {
      global.io.to(req.params.userId).emit('plan_upgraded', {
        plan,
        message: `تم ترقية خطتك إلى ${plan} بواسطة الأدمن`
      });
    }

    res.json(sub);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
