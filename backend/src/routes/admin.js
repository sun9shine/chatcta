const router = require('express').Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Page = require('../models/Page');
const Message = require('../models/Message');
const Comment = require('../models/Comment');
const Bot = require('../models/Bot');
const Subscription = require('../models/Subscription');
const { auth, adminOnly } = require('../middleware/auth');

router.use(auth, adminOnly);

// ─── Dashboard stats ──────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [users, pages, bots, messages, comments, proUsers, enterpriseUsers] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Page.countDocuments(),
      Bot.countDocuments(),
      Message.countDocuments(),
      Comment.countDocuments(),
      User.countDocuments({ role: 'user', plan: 'pro' }),
      User.countDocuments({ role: 'user', plan: 'enterprise' })
    ]);
    res.json({ users, pages, bots, messages, comments, proUsers, enterpriseUsers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── User management ──────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status, plan } = req.query;
    const query = { role: 'user' };
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: new RegExp(escaped, 'i') },
        { email: new RegExp(escaped, 'i') },
        { phone: new RegExp(escaped, 'i') }
      ];
    }
    if (status === 'banned') query.isBanned = true;
    if (status === 'active') query.isBanned = false;
    if (plan) query.plan = plan;
    const users = await User.find(query)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort('-createdAt');
    const total = await User.countDocuments(query);
    res.json({ users, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    const pages = await Page.find({ userId: req.params.id });
    const bots = await Bot.find({ userId: req.params.id });
    const sub = await Subscription.findOne({ userId: req.params.id });
    res.json({ user, pages, bots, subscription: sub });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/users/:id/ban', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBanned: true, banReason: req.body.reason },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/users/:id/unban', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBanned: false, banReason: undefined },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── UPGRADE USER PLAN (FREE - no payment needed) ─────
router.put('/users/:id/upgrade', async (req, res) => {
  try {
    const { plan, expiresAt, adminNote } = req.body;
    const validPlans = ['free', 'pro', 'enterprise'];
    if (!validPlans.includes(plan)) return res.status(400).json({ error: 'Invalid plan' });

    // Update Subscription record
    const sub = await Subscription.findOneAndUpdate(
      { userId: req.params.id },
      {
        plan,
        status: 'active',
        upgradedByAdmin: true,
        upgradedBy: req.user._id,
        adminNote: adminNote || `Upgraded to ${plan} by admin on ${new Date().toLocaleDateString()}`,
        startedAt: new Date(),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      { upsert: true, new: true }
    );

    // Sync plan on User model (quick access)
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { plan, planExpiresAt: expiresAt ? new Date(expiresAt) : null },
      { new: true }
    ).select('-password');

    // Real-time notification
    if (global.io) {
      global.io.to(req.params.id).emit('plan_upgraded', {
        plan,
        message: plan === 'free'
          ? 'تم تغيير خطتك إلى المجانية'
          : `🎉 تم ترقية خطتك إلى ${plan === 'pro' ? 'الاحترافية' : 'المؤسسية'} مجاناً بواسطة الأدمن!`,
        expiresAt: expiresAt || null
      });
    }

    res.json({ user, subscription: sub });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    await Page.deleteMany({ userId: req.params.id });
    await Bot.deleteMany({ userId: req.params.id });
    await Subscription.deleteOne({ userId: req.params.id });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin credentials ────────────────────────────────
router.put('/credentials', async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await User.findById(req.user._id);
    if (email) admin.email = email;
    if (password) admin.password = await bcrypt.hash(password, 12);
    await admin.save();
    res.json({ message: 'Credentials updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Data export ──────────────────────────────────────
router.get('/data-export', async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).select('-password');
    const pages = await Page.find().populate('userId', 'name email');
    const subs = await Subscription.find();
    const subMap = Object.fromEntries(subs.map(s => [s.userId.toString(), s]));

    const data = users.map(u => ({
      id: u._id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      language: u.language,
      plan: u.plan,
      registeredAt: u.createdAt,
      lastLogin: u.lastLogin,
      isBanned: u.isBanned,
      subscription: subMap[u._id.toString()]?.plan || 'free',
      upgradedByAdmin: subMap[u._id.toString()]?.upgradedByAdmin || false,
      pages: pages.filter(p => p.userId?._id.toString() === u._id.toString()).map(p => ({
        platform: p.platform,
        pageName: p.pageName,
        pageId: p.pageId
      }))
    }));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Publish ──────────────────────────────────────────
router.post('/publish', async (req, res) => {
  try {
    const { content, imageUrl, userIds, allUsers, platform } = req.body;
    let targetUsers = userIds;
    if (allUsers) targetUsers = (await User.find({ role: 'user', isBanned: false })).map(u => u._id);
    const pages = await Page.find({ userId: { $in: targetUsers }, ...(platform ? { platform } : {}) });
    const PublishService = require('../services/publishService');
    const results = await PublishService.publishToPages(pages, content, imageUrl);
    res.json({ published: results.success, failed: results.failed, total: pages.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Message user ─────────────────────────────────────
router.post('/message-user', async (req, res) => {
  try {
    const { userId, content, subject } = req.body;
    const SupportMessage = require('../models/SupportMessage');
    const msg = await SupportMessage.create({
      from: req.user._id, to: userId, content, subject, isAdminReply: true
    });
    if (global.io) global.io.to(userId).emit('support_message', msg);
    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
