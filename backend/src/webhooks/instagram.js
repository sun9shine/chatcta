const router = require('express').Router();
const Page = require('../models/Page');
const Comment = require('../models/Comment');
const Message = require('../models/Message');
const AutoReplyService = require('../services/autoReplyService');

// ─────────────────────────────────────────────────────────────────────────────
// GET /webhook/instagram — Meta Webhook Verification
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const VERIFY_TOKEN = process.env.IG_VERIFY_TOKEN || process.env.FB_VERIFY_TOKEN || process.env.FACEBOOK_VERIFY_TOKEN || 'chatcta_verify_2024';

  console.log('[IG Webhook GET] mode:', mode, '| token:', token, '| expected:', VERIFY_TOKEN);

  if (!mode || !token) {
    console.log('[IG Webhook GET] ❌ Missing params → 400');
    return res.status(400).send('Missing hub.mode or hub.verify_token');
  }

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[IG Webhook GET] ✅ Verification SUCCESS');
    return res.status(200).send(challenge);
  }

  console.log('[IG Webhook GET] ❌ Token mismatch → 403');
  return res.status(403).send('Forbidden');
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /webhook/instagram — Receive events
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  res.sendStatus(200);
  try {
    const body = req.body;
    console.log('[IG Webhook POST] object:', body.object, '| entries:', body.entry?.length || 0);
    if (body.object !== 'instagram') return;

    for (const entry of body.entry || []) {
      const igId = entry.id;
      const page = await Page.findOne({ pageId: igId, platform: 'instagram', isActive: true });
      if (!page) { console.log('[IG Webhook POST] Page not found:', igId); continue; }

      for (const event of entry.messaging || []) {
        if (event.message) {
          const msgDoc = await Message.create({
            userId: page.userId, pageId: page._id, platform: 'instagram',
            type: 'incoming', senderId: event.sender.id,
            content: event.message.text, rawData: event
          });
          if (global.io) global.io.to(page.userId.toString()).emit('new_message', msgDoc);
          await AutoReplyService.processComment(page, {
            senderId: event.sender.id, content: event.message.text, postId: null, commentId: null
          });
        }
      }

      for (const change of entry.changes || []) {
        if (change.field === 'comments') {
          const v = change.value;
          const commentDoc = await Comment.findOneAndUpdate(
            { commentId: v.id },
            { userId: page.userId, pageId: page._id, platform: 'instagram', postId: v.media?.id, commentId: v.id, senderId: v.from?.id, senderName: v.from?.username, content: v.text, rawData: v },
            { upsert: true, new: true }
          );
          if (global.io) global.io.to(page.userId.toString()).emit('new_comment', commentDoc);
          await AutoReplyService.processComment(page, {
            senderId: v.from?.id, senderName: v.from?.username, content: v.text, postId: v.media?.id, commentId: v.id
          });
        }
      }
    }
  } catch (err) {
    console.error('[IG Webhook POST] Error:', err.message);
  }
});

module.exports = router;
