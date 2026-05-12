const router = require('express').Router();
const axios = require('axios');
const Page = require('../models/Page');
const PlatformConfig = require('../models/PlatformConfig');
const { auth } = require('../middleware/auth');

router.use(auth);

// Get user pages
router.get('/', async (req, res) => {
  try {
    const pages = await Page.find({ userId: req.user._id });
    res.json(pages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Facebook OAuth - get user pages
router.post('/facebook/connect', async (req, res) => {
  try {
    const { accessToken } = req.body;
    const config = await PlatformConfig.findOne({ platform: 'facebook', isEnabled: true });
    if (!config) return res.status(400).json({ error: 'Facebook platform not enabled' });

    const resp = await axios.get(`https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}&fields=id,name,picture,access_token,fan_count`);
    const fbPages = resp.data.data;

    const saved = [];
    for (const p of fbPages) {
      const page = await Page.findOneAndUpdate(
        { userId: req.user._id, platform: 'facebook', pageId: p.id },
        {
          pageName: p.name,
          pageAvatar: p.picture?.data?.url,
          accessToken: p.access_token,
          followers: p.fan_count || 0,
          webhookSubscribed: false
        },
        { upsert: true, new: true }
      );
      saved.push(page);
      // Subscribe webhook
      try {
        await axios.post(`https://graph.facebook.com/v18.0/${p.id}/subscribed_apps?access_token=${p.access_token}`, {
          subscribed_fields: 'messages,messaging_postbacks,comments,feed'
        });
      } catch (e) {}
    }
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Instagram connect
router.post('/instagram/connect', async (req, res) => {
  try {
    const { accessToken, igAccountId } = req.body;
    const resp = await axios.get(`https://graph.facebook.com/v18.0/${igAccountId}?fields=id,name,username,profile_picture_url,followers_count&access_token=${accessToken}`);
    const ig = resp.data;
    const page = await Page.findOneAndUpdate(
      { userId: req.user._id, platform: 'instagram', pageId: ig.id },
      { pageName: ig.name || ig.username, pageUsername: ig.username, pageAvatar: ig.profile_picture_url, accessToken, followers: ig.followers_count || 0 },
      { upsert: true, new: true }
    );
    res.json(page);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Telegram connect
router.post('/telegram/connect', async (req, res) => {
  try {
    const { botToken, chatId } = req.body;
    const resp = await axios.get(`https://api.telegram.org/bot${botToken}/getMe`);
    const bot = resp.data.result;
    const page = await Page.findOneAndUpdate(
      { userId: req.user._id, platform: 'telegram', pageId: String(bot.id) },
      { pageName: bot.first_name, pageUsername: bot.username, accessToken: botToken, metadata: { chatId } },
      { upsert: true, new: true }
    );
    res.json(page);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// WhatsApp connect
router.post('/whatsapp/connect', async (req, res) => {
  try {
    const { phoneNumberId, accessToken } = req.body;
    const config = await PlatformConfig.findOne({ platform: 'whatsapp' });
    const resp = await axios.get(`https://graph.facebook.com/v18.0/${phoneNumberId}?fields=display_phone_number,verified_name&access_token=${accessToken || config?.accessToken}`);
    const wa = resp.data;
    const page = await Page.findOneAndUpdate(
      { userId: req.user._id, platform: 'whatsapp', pageId: phoneNumberId },
      { pageName: wa.verified_name || wa.display_phone_number, pageUsername: wa.display_phone_number, accessToken, metadata: { phoneNumberId } },
      { upsert: true, new: true }
    );
    res.json(page);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// TikTok connect
router.post('/tiktok/connect', async (req, res) => {
  try {
    const { accessToken, openId } = req.body;
    const resp = await axios.get(`https://open.tiktokapis.com/v2/user/info/?fields=display_name,username,avatar_url,follower_count`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const user = resp.data.data.user;
    const page = await Page.findOneAndUpdate(
      { userId: req.user._id, platform: 'tiktok', pageId: openId },
      { pageName: user.display_name, pageUsername: user.username, pageAvatar: user.avatar_url, accessToken, followers: user.follower_count || 0 },
      { upsert: true, new: true }
    );
    res.json(page);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Disconnect page
router.delete('/:id', async (req, res) => {
  try {
    await Page.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ message: 'Page disconnected' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle page active
router.put('/:id/toggle', async (req, res) => {
  try {
    const page = await Page.findOne({ _id: req.params.id, userId: req.user._id });
    if (!page) return res.status(404).json({ error: 'Page not found' });
    page.isActive = !page.isActive;
    await page.save();
    res.json(page);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
