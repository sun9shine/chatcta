const router = require('express').Router();
const Page = require('../models/Page');
const Message = require('../models/Message');
const AutoReplyService = require('../services/autoReplyService');

// GET /webhook/telegram — health check / verification
router.get('/', (req, res) => {
  res.json({ status: 'ok', platform: 'telegram', webhook: 'active' });
});

// GET /webhook/telegram/:token — verify webhook is set
router.get('/:token', (req, res) => {
  res.json({ status: 'ok', platform: 'telegram', webhook: 'active', message: 'Webhook endpoint ready. Use POST to send updates.' });
});

// POST /webhook/telegram/:token — receive updates from Telegram
router.post('/:token', async (req, res) => {
  res.sendStatus(200);
  try {
    const { token } = req.params;
    const update = req.body;
    const page = await Page.findOne({ accessToken: token, platform: 'telegram', isActive: true });
    if (!page) return;

    const msg = update.message || update.channel_post;
    if (msg) {
      const senderId = String(msg.chat.id);
      const content = msg.text || msg.caption || '';
      const msgDoc = await Message.create({
        userId: page.userId, pageId: page._id, platform: 'telegram',
        type: 'incoming', senderId,
        senderName: msg.from?.first_name || msg.chat.title,
        content, rawData: msg
      });
      if (global.io) global.io.to(page.userId.toString()).emit('new_message', msgDoc);
      await AutoReplyService.processComment(page, {
        senderId, content, postId: null, commentId: null
      });
    }
  } catch (err) {
    console.error('Telegram Webhook Error:', err.message);
  }
});

module.exports = router;
