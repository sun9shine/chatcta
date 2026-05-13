const router = require('express').Router();
const ScheduledPost = require('../models/ScheduledPost');
const Page = require('../models/Page');
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const q = { userId: req.user._id };
    if (status) q.status = status;
    const posts = await ScheduledPost.find(q).populate('pageIds', 'pageName platform').sort('scheduledAt');
    res.json(posts);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { content, pageIds, scheduledAt, platforms, timezone, repeat } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : req.body.imageUrl;
    // Verify pages belong to user
    const ids = JSON.parse(pageIds || '[]');
    const pages = await Page.find({ _id: { $in: ids }, userId: req.user._id });
    if (pages.length === 0) return res.status(400).json({ error: 'No valid pages' });

    const post = await ScheduledPost.create({
      userId: req.user._id,
      pageIds: pages.map(p => p._id),
      platforms: platforms ? JSON.parse(platforms) : pages.map(p => p.platform),
      content,
      imageUrl,
      scheduledAt: new Date(scheduledAt),
      timezone: timezone || 'UTC',
      repeat: repeat ? JSON.parse(repeat) : { enabled: false },
    });
    res.status(201).json(post);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const post = await ScheduledPost.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, status: 'pending' },
      req.body, { new: true }
    );
    if (!post) return res.status(404).json({ error: 'Not found or already published' });
    res.json(post);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await ScheduledPost.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { status: 'cancelled' }
    );
    res.json({ message: 'Cancelled' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
