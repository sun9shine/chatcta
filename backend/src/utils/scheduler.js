const ScheduledPost = require('../models/ScheduledPost');
const Page = require('../models/Page');
const PublishService = require('../services/publishService');

module.exports = async function runScheduledPosts() {
  const now = new Date();
  const pending = await ScheduledPost.find({
    status: 'pending',
    scheduledAt: { $lte: now }
  }).populate('pageIds');

  for (const post of pending) {
    try {
      const pages = post.pageIds.filter(p => p && p.isActive);
      const results = await PublishService.publishToPages(pages, post.content, post.imageUrl);

      post.status = results.failed === pages.length ? 'failed' : 'published';
      post.publishedAt = new Date();
      post.results = results.details.map(r => ({
        pageId: r.pageId,
        pageName: r.pageName,
        platform: r.platform,
        status: r.status,
        error: r.error
      }));

      // Handle repeat
      if (post.repeat?.enabled && post.repeat?.interval) {
        const intervals = { daily: 86400000, weekly: 604800000, monthly: 2592000000 };
        const nextDate = new Date(post.scheduledAt.getTime() + (intervals[post.repeat.interval] || 86400000));
        if (!post.repeat.endAt || nextDate <= new Date(post.repeat.endAt)) {
          await ScheduledPost.create({
            userId: post.userId,
            pageIds: post.pageIds.map(p => p._id || p),
            platforms: post.platforms,
            content: post.content,
            imageUrl: post.imageUrl,
            scheduledAt: nextDate,
            timezone: post.timezone,
            repeat: post.repeat
          });
        }
      }

      await post.save();
      console.log(`✅ Scheduled post ${post._id} published`);

      // Notify via socket
      if (global.io) {
        global.io.to(post.userId.toString()).emit('scheduled_post_published', {
          postId: post._id,
          published: results.success,
          failed: results.failed
        });
      }
    } catch (err) {
      post.status = 'failed';
      await post.save();
      console.error(`❌ Scheduled post ${post._id} failed:`, err.message);
    }
  }
};
