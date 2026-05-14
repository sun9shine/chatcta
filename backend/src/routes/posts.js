const router = require('express').Router();
const axios = require('axios');
const Page = require('../models/Page');
const { auth } = require('../middleware/auth');

router.use(auth);

// GET /api/posts/:pageId — fetch recent posts from a connected page
router.get('/:pageId', async (req, res) => {
  try {
    const page = await Page.findOne({ _id: req.params.pageId, userId: req.user._id });
    if (!page) return res.status(404).json({ error: 'Page not found' });

    let posts = [];

    switch (page.platform) {
      case 'facebook': {
        const url = `https://graph.facebook.com/v18.0/${page.pageId}/posts?fields=id,message,created_time,full_picture,permalink_url&limit=25&access_token=${page.accessToken}`;
        const r = await axios.get(url);
        posts = (r.data?.data || []).map(p => ({
          id: p.id, message: (p.message || '').slice(0, 200),
          createdAt: p.created_time, mediaUrl: p.full_picture,
          permalink: p.permalink_url, platform: 'facebook'
        }));
        break;
      }
      case 'instagram': {
        const url = `https://graph.facebook.com/v18.0/${page.pageId}/media?fields=id,caption,media_url,thumbnail_url,permalink,timestamp&limit=25&access_token=${page.accessToken}`;
        const r = await axios.get(url);
        posts = (r.data?.data || []).map(p => ({
          id: p.id, message: (p.caption || '').slice(0, 200),
          createdAt: p.timestamp, mediaUrl: p.media_url || p.thumbnail_url,
          permalink: p.permalink, platform: 'instagram'
        }));
        break;
      }
      case 'telegram': {
        posts = (page.metadata?.recentPosts || []).map(p => ({ ...p, platform: 'telegram' }));
        break;
      }
      case 'tiktok': {
        try {
          const r = await axios.get('https://open.tiktokapis.com/v2/video/list/?fields=id,title,create_time,cover_image_url,share_url', {
            headers: { Authorization: `Bearer ${page.accessToken}` }
          });
          posts = (r.data?.data?.videos || []).map(p => ({
            id: p.id, message: p.title || '',
            createdAt: new Date((p.create_time || 0) * 1000).toISOString(),
            mediaUrl: p.cover_image_url, permalink: p.share_url, platform: 'tiktok'
          }));
        } catch { posts = []; }
        break;
      }
      default: posts = [];
    }

    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.response?.data?.error?.message || err.message });
  }
});

module.exports = router;
