const router = require('express').Router();
const Bot = require('../models/Bot');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const bots = await Bot.find({ userId: req.user._id }).populate('pageId', 'pageName platform');
    res.json(bots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const bot = await Bot.create({ ...req.body, userId: req.user._id });
    res.status(201).json(bot);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const bot = await Bot.findOne({ _id: req.params.id, userId: req.user._id }).populate('pageId');
    if (!bot) return res.status(404).json({ error: 'Bot not found' });
    res.json(bot);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const bot = await Bot.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body, { new: true }
    );
    res.json(bot);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/toggle', async (req, res) => {
  try {
    const bot = await Bot.findOne({ _id: req.params.id, userId: req.user._id });
    if (!bot) return res.status(404).json({ error: 'Bot not found' });
    bot.isActive = !bot.isActive;
    await bot.save();
    res.json(bot);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Bot.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ message: 'Bot deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
