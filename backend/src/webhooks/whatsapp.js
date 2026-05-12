const router = require('express').Router();
const Page = require('../models/Page');
const Message = require('../models/Message');
const AutoReplyService = require('../services/autoReplyService');

router.get('/', (req, res) => {
  const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = req.query;
  if (mode === 'subscribe' && token === (process.env.WA_VERIFY_TOKEN || 'chatcta_verify_2024')) {
    return res.send(challenge);
  }
  res.sendStatus(403);
});

router.post('/', async (req, res) => {
  res.sendStatus(200);
  try {
    const body = req.body;
    if (body.object !== 'whatsapp_business_account') return;

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== 'messages') continue;
        const value = change.value;
        const phoneId = value.metadata?.phone_number_id;
        const page = await Page.findOne({ pageId: phoneId, platform: 'whatsapp', isActive: true });
        if (!page) continue;

        for (const msg of value.messages || []) {
          const content = msg.text?.body || msg.image?.caption || msg.document?.filename || '';
          const msgDoc = await Message.create({
            userId: page.userId, pageId: page._id, platform: 'whatsapp',
            type: 'incoming', senderId: msg.from, senderName: value.contacts?.[0]?.profile?.name,
            content, rawData: msg
          });
          if (global.io) global.io.to(page.userId.toString()).emit('new_message', msgDoc);
          await AutoReplyService.processComment(page, {
            senderId: msg.from, content, postId: null, commentId: null
          });
        }
      }
    }
  } catch (err) {
    console.error('WhatsApp Webhook Error:', err.message);
  }
});

module.exports = router;
