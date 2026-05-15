const router = require('express').Router();
const Page = require('../models/Page');
const Comment = require('../models/Comment');
const AutoReplyService = require('../services/autoReplyService');

// ─────────────────────────────────────────────────────────────────────────────
// GET /webhook/tiktok — Webhook verification / health check
// TikTok may send a GET to verify the endpoint is reachable
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const challenge = req.query['challenge'];
  const verifyToken = req.query['verify_token'];

  const VERIFY_TOKEN = process.env.TIKTOK_VERIFY_TOKEN || process.env.FB_VERIFY_TOKEN || 'chatcta_verify_2024';

  console.log('[TikTok Webhook GET] challenge:', challenge, '| verify_token:', verifyToken);

  // If TikTok sends a challenge, return it
  if (challenge) {
    if (verifyToken && verifyToken !== VERIFY_TOKEN) {
      console.log('[TikTok Webhook GET] ❌ Token mismatch → 403');
      return res.status(403).send('Forbidden');
    }
    console.log('[TikTok Webhook GET] ✅ Returning challenge');
    return res.status(200).send(challenge);
  }

  // Otherwise just confirm the endpoint is active
  res.status(200).json({ status: 'ok', platform: 'tiktok', webhook: 'active' });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /webhook/tiktok — Receive TikTok events
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  res.sendStatus(200);
  try {
    const body = req.body;
    const event = body.event;
    console.log('[TikTok Webhook POST] event:', event);

    if (event === 'comments') {
      const userId = body.user?.open_id;
      const page = await Page.findOne({ pageId: userId, platform: 'tiktok', isActive: true });
      if (!page) { console.log('[TikTok Webhook POST] Page not found for user:', userId); return; }

      const commentData = body.comment;
      const commentDoc = await Comment.findOneAndUpdate(
        { commentId: commentData?.id },
        {
          userId: page.userId, pageId: page._id, platform: 'tiktok',
          postId: commentData?.video_id, commentId: commentData?.id,
          senderId: commentData?.user?.open_id, senderName: commentData?.user?.nickname,
          content: commentData?.text, rawData: body
        },
        { upsert: true, new: true }
      );
      if (global.io) global.io.to(page.userId.toString()).emit('new_comment', commentDoc);
      await AutoReplyService.processComment(page, {
        senderId: commentData?.user?.open_id, senderName: commentData?.user?.nickname,
        content: commentData?.text, postId: commentData?.video_id, commentId: commentData?.id
      });
    }
  } catch (err) {
    console.error('[TikTok Webhook POST] Error:', err.message);
  }
});

module.exports = router;
