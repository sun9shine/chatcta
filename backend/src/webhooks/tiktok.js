const router = require('express').Router();
const Page = require('../models/Page');
const Comment = require('../models/Comment');
const AutoReplyService = require('../services/autoReplyService');

router.get('/', (req, res) => {
  // TikTok webhook verification
  res.json({ status: 'ok' });
});

router.post('/', async (req, res) => {
  res.sendStatus(200);
  try {
    const body = req.body;
    const event = body.event;
    if (event === 'comments') {
      const userId = body.user?.open_id;
      const page = await Page.findOne({ pageId: userId, platform: 'tiktok', isActive: true });
      if (!page) return;

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
    console.error('TikTok Webhook Error:', err.message);
  }
});

module.exports = router;
