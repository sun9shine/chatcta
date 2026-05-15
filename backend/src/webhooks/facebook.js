const router = require('express').Router();
const Page = require('../models/Page');
const Comment = require('../models/Comment');
const Message = require('../models/Message');
const AutoReplyService = require('../services/autoReplyService');

// ─────────────────────────────────────────────────────────────────────────────
// GET /webhook/facebook — Meta Webhook Verification
// Meta sends: ?hub.mode=subscribe&hub.verify_token=xxx&hub.challenge=yyy
// Must return challenge as plain text with status 200
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || process.env.FACEBOOK_VERIFY_TOKEN || 'chatcta_verify_2024';

  console.log('[FB Webhook GET] mode:', mode);
  console.log('[FB Webhook GET] incoming token:', token);
  console.log('[FB Webhook GET] expected token:', VERIFY_TOKEN);
  console.log('[FB Webhook GET] challenge:', challenge);

  if (!mode || !token) {
    console.log('[FB Webhook GET] ❌ Missing mode or token → 400');
    return res.status(400).send('Missing hub.mode or hub.verify_token');
  }

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[FB Webhook GET] ✅ Verification SUCCESS');
    return res.status(200).send(challenge);
  }

  console.log('[FB Webhook GET] ❌ Token mismatch → 403');
  return res.status(403).send('Forbidden: verify_token mismatch');
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /webhook/facebook — Receive events from Meta
// Must respond with 200 immediately, then process asynchronously
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  // IMPORTANT: respond immediately with 200 (Meta requires < 5 seconds)
  res.sendStatus(200);

  try {
    const body = req.body;
    console.log('[FB Webhook POST] object:', body.object, '| entries:', body.entry?.length || 0);

    if (body.object !== 'page') return;

    for (const entry of body.entry || []) {
      const pageId = entry.id;
      const page = await Page.findOne({ pageId, platform: 'facebook', isActive: true });
      if (!page) { console.log('[FB Webhook POST] Page not found:', pageId); continue; }

      // Handle messages
      for (const event of entry.messaging || []) {
        if (event.message) {
          const msgDoc = await Message.create({
            userId: page.userId,
            pageId: page._id,
            platform: 'facebook',
            type: 'incoming',
            senderId: event.sender.id,
            content: event.message.text,
            status: 'delivered',
            rawData: event
          });
          if (global.io) global.io.to(page.userId.toString()).emit('new_message', msgDoc);

          await AutoReplyService.processComment(page, {
            senderId: event.sender.id,
            content: event.message.text,
            postId: null,
            commentId: null
          });
        }
      }

      // Handle comments/feed
      for (const change of entry.changes || []) {
        if (change.field === 'feed' && change.value?.item === 'comment') {
          const v = change.value;
          const commentDoc = await Comment.findOneAndUpdate(
            { commentId: v.comment_id },
            {
              userId: page.userId,
              pageId: page._id,
              platform: 'facebook',
              postId: v.post_id,
              commentId: v.comment_id,
              senderId: v.from?.id,
              senderName: v.from?.name,
              content: v.message,
              rawData: v
            },
            { upsert: true, new: true }
          );
          if (global.io) global.io.to(page.userId.toString()).emit('new_comment', commentDoc);

          await AutoReplyService.processComment(page, {
            senderId: v.from?.id,
            senderName: v.from?.name,
            content: v.message,
            postId: v.post_id,
            commentId: v.comment_id
          });
        }
      }
    }
  } catch (err) {
    console.error('[FB Webhook POST] Error:', err.message);
  }
});

module.exports = router;
