const router = require('express').Router();
const Page = require('../models/Page');
const Message = require('../models/Message');
const AutoReplyService = require('../services/autoReplyService');

// ─────────────────────────────────────────────────────────────────────────────
// GET /webhook/telegram — Health check
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  console.log('[Telegram Webhook GET] /');
  res.status(200).json({ status: 'ok', platform: 'telegram', webhook: 'active' });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /webhook/telegram/:token — Verify endpoint is ready for this bot
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:token', (req, res) => {
  console.log('[Telegram Webhook GET] /:token →', req.params.token?.slice(0, 10) + '...');
  res.status(200).json({ status: 'ok', platform: 'telegram', webhook: 'active', message: 'POST updates to this URL' });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /webhook/telegram/:token — Receive updates from Telegram Bot API
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:token', async (req, res) => {
  res.sendStatus(200);
  try {
    const { token } = req.params;
    const update = req.body;
    console.log('[Telegram Webhook POST] update_id:', update.update_id, '| token:', token?.slice(0, 10) + '...');

    const page = await Page.findOne({ accessToken: token, platform: 'telegram', isActive: true });
    if (!page) { console.log('[Telegram Webhook POST] Page not found for token'); return; }

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
    console.error('[Telegram Webhook POST] Error:', err.message);
  }
});

module.exports = router;
