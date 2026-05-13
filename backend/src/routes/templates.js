const router = require('express').Router();
const BotTemplate = require('../models/BotTemplate');
const Bot = require('../models/Bot');
const { auth, adminOnly } = require('../middleware/auth');

// Get all templates (public)
router.get('/', auth, async (req, res) => {
  try {
    const { category, platform } = req.query;
    const q = {};
    if (category) q.category = category;
    if (platform && platform !== 'all') q.platform = { $in: [platform, 'all'] };
    const templates = await BotTemplate.find(q).sort('category name');
    res.json(templates);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Use a template → create a bot from it
router.post('/:id/use', auth, async (req, res) => {
  try {
    const tpl = await BotTemplate.findById(req.params.id);
    if (!tpl) return res.status(404).json({ error: 'Template not found' });

    const botData = {
      userId: req.user._id,
      name: req.body.name || tpl.name,
      platform: req.body.platform || tpl.platform,
      pageId: req.body.pageId,
      type: tpl.type,
      isActive: true,
      useAI: tpl.config.useAI,
      aiPrompt: tpl.config.aiPrompt,
      allPosts: tpl.config.allPosts,
      triggers: tpl.config.triggers || [],
      actions: tpl.config.actions || []
    };

    const bot = await Bot.create(botData);
    await BotTemplate.findByIdAndUpdate(req.params.id, { $inc: { usageCount: 1 } });
    res.status(201).json(bot);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin: create template
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const tpl = await BotTemplate.create({ ...req.body, createdBy: req.user._id, isBuiltIn: false });
    res.status(201).json(tpl);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin: update template
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const tpl = await BotTemplate.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(tpl);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin: delete template
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await BotTemplate.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
