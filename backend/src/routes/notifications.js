const router = require('express').Router();
const PushSubscription = require('../models/PushSubscription');
const { auth, adminOnly } = require('../middleware/auth');

// Save push subscription
router.post('/subscribe', auth, async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint) return res.status(400).json({ error: 'endpoint required' });
    const sub = await PushSubscription.findOneAndUpdate(
      { endpoint },
      { userId: req.user._id, endpoint, keys, isActive: true, lastUsed: new Date() },
      { upsert: true, new: true }
    );
    res.json(sub);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Unsubscribe
router.post('/unsubscribe', auth, async (req, res) => {
  try {
    await PushSubscription.findOneAndUpdate(
      { endpoint: req.body.endpoint, userId: req.user._id },
      { isActive: false }
    );
    res.json({ message: 'Unsubscribed' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get VAPID public key
router.get('/vapid-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || '' });
});

// Admin: send push to all or specific users
router.post('/send', auth, adminOnly, async (req, res) => {
  try {
    const { title, body, userIds, allUsers, url } = req.body;
    const q = { isActive: true };
    if (!allUsers && userIds?.length) q.userId = { $in: userIds };

    const subs = await PushSubscription.find(q);
    let sent = 0;

    // Use web-push if configured
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      const webpush = require('web-push');
      webpush.setVapidDetails(
        `mailto:${process.env.ADMIN_EMAIL || 'admin@chatcta.com'}`,
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
      const payload = JSON.stringify({ title, body, url: url || '/' });
      for (const sub of subs) {
        try {
          await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload);
          sent++;
        } catch (e) {
          if (e.statusCode === 410) {
            await PushSubscription.findByIdAndUpdate(sub._id, { isActive: false });
          }
        }
      }
    }

    // Also send via socket for online users
    if (global.io) {
      const socketPayload = { title, body, url };
      if (allUsers) {
        global.io.emit('push_notification', socketPayload);
      } else {
        userIds?.forEach(id => global.io.to(id).emit('push_notification', socketPayload));
      }
    }

    res.json({ sent, total: subs.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
