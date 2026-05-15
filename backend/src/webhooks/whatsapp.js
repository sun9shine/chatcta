const router = require('express').Router();
const Page = require('../models/Page');
const Message = require('../models/Message');
const AutoReplyService = require('../services/autoReplyService');

// ─────────────────────────────────────────────────────────────────────────────
// GET /webhook/whatsapp — Meta Webhook Verification
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const VERIFY_TOKEN = process.env.WA_VERIFY_TOKEN || process.env.FB_VERIFY_TOKEN || 'chatcta_verify_2024';

  console.log('[WA Webhook GET] mode:', mode, '| token:', token, '| expected:', VERIFY_TOKEN);

  if (!mode || !token) {
    console.log('[WA Webhook GET] ❌ Missing params → 400');
    return res.status(400).send('Missing hub.mode or hub.verify_token');
  }

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[WA Webhook GET] ✅ Verification SUCCESS');
    return res.status(200).send(challenge);
  }

  console.log('[WA Webhook GET] ❌ Token mismatch → 403');
  return res.status(403).send('Forbidden');
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /webhook/whatsapp — Receive WhatsApp Cloud API events
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  res.sendStatus(200);
  try {
    const body = req.body;
    console.log('[WA Webhook POST] object:', body.object, '| entries:', body.entry?.length || 0);
    if (body.object !== 'whatsapp_business_account') return;

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== 'messages') continue;
        const value = change.value;
        const phoneId = value.metadata?.phone_number_id;
        const page = await Page.findOne({ pageId: phoneId, platform: 'whatsapp', isActive: true });
        if (!page) { console.log('[WA Webhook POST] Page not found for phoneId:', phoneId); continue; }

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
    console.error('[WA Webhook POST] Error:', err.message);
  }
});

module.exports = router;
