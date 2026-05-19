const router = require('express').Router();
const Flow = require('../models/Flow');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const { type, platform } = req.query;
    const query = { userId: req.user._id };
    if (type) query.type = type;
    if (platform) query.platform = platform;
    const flows = await Flow.find(query).populate('pageId', 'pageName platform');
    res.json(flows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const flow = await Flow.create({ ...req.body, userId: req.user._id });
    res.status(201).json(flow);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const flow = await Flow.findOne({ _id: req.params.id, userId: req.user._id });
    if (!flow) return res.status(404).json({ error: 'Flow not found' });
    res.json(flow);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const flow = await Flow.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body, { new: true }
    );
    res.json(flow);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/toggle', async (req, res) => {
  try {
    const flow = await Flow.findOne({ _id: req.params.id, userId: req.user._id });
    if (!flow) return res.status(404).json({ error: 'Flow not found' });
    flow.isActive = !flow.isActive;
    await flow.save();
    res.json(flow);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Flow.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ message: 'Flow deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
