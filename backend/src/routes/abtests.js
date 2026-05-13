const router = require('express').Router();
const ABTest = require('../models/ABTest');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const tests = await ABTest.find({ userId: req.user._id }).populate('botId', 'name platform');
    res.json(tests);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const test = await ABTest.create({ ...req.body, userId: req.user._id });
    res.status(201).json(test);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const test = await ABTest.findOne({ _id: req.params.id, userId: req.user._id }).populate('botId');
    if (!test) return res.status(404).json({ error: 'Not found' });
    res.json(test);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const test = await ABTest.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body, { new: true }
    );
    res.json(test);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id/winner', async (req, res) => {
  try {
    const test = await ABTest.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { winner: req.body.winner, decidedAt: new Date(), isActive: false },
      { new: true }
    );
    res.json(test);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await ABTest.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get next variant for a test (round-robin weighted)
router.post('/:id/pick-variant', async (req, res) => {
  try {
    const test = await ABTest.findOne({ _id: req.params.id, userId: req.user._id, isActive: true });
    if (!test || !test.variants.length) return res.status(404).json({ error: 'No active test' });
    // Weighted random pick
    const total = test.variants.reduce((sum, v) => sum + (v.weight || 50), 0);
    let r = Math.random() * total;
    let picked = test.variants[0];
    for (const v of test.variants) {
      r -= (v.weight || 50);
      if (r <= 0) { picked = v; break; }
    }
    // Increment sent
    await ABTest.updateOne(
      { _id: test._id, 'variants.label': picked.label },
      { $inc: { 'variants.$.stats.sent': 1, totalSent: 1 } }
    );
    res.json({ variant: picked });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
