const router = require('express').Router();
const Page = require('../models/Page');
const Message = require('../models/Message');
const AutoReplyService = require('../services/autoReplyService');

// Telegram sends to /webhook/telegram/:botToken
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
