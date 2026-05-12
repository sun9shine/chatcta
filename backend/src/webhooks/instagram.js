const router = require('express').Router();
const Page = require('../models/Page');
const Comment = require('../models/Comment');
const Message = require('../models/Message');
const AutoReplyService = require('../services/autoReplyService');

router.get('/', (req, res) => {
  const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = req.query;
  if (mode === 'subscribe' && token === (process.env.IG_VERIFY_TOKEN || process.env.FB_VERIFY_TOKEN || 'chatcta_verify_2024')) {
    return res.send(challenge);
  }
  res.sendStatus(403);
});

router.post('/', async (req, res) => {
  res.sendStatus(200);
  try {
    const body = req.body;
    if (body.object !== 'instagram') return;

    for (const entry of body.entry || []) {
      const igId = entry.id;
      const page = await Page.findOne({ pageId: igId, platform: 'instagram', isActive: true });
      if (!page) continue;

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
    console.error('IG Webhook Error:', err.message);
  }
});

module.exports = router;
