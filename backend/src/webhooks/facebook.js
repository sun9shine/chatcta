const router = require('express').Router();
const Page = require('../models/Page');
const Comment = require('../models/Comment');
const Message = require('../models/Message');
const AutoReplyService = require('../services/autoReplyService');

// Webhook verification
router.get('/', (req, res) => {
  const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = req.query;
  if (mode === 'subscribe' && token === (process.env.FB_VERIFY_TOKEN || 'chatcta_verify_2024')) {
    return res.send(challenge);
  }
  res.sendStatus(403);
});

// Webhook events
router.post('/', async (req, res) => {
  res.sendStatus(200); // Respond immediately
  try {
    const body = req.body;
    if (body.object !== 'page') return;

    for (const entry of body.entry || []) {
      const pageId = entry.id;
      const page = await Page.findOne({ pageId, platform: 'facebook', isActive: true }).populate('userId');
      if (!page) continue;

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

          // Auto-reply bot
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
        if (change.field === 'feed' && change.value.item === 'comment') {
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
    console.error('FB Webhook Error:', err.message);
  }
});

module.exports = router;
