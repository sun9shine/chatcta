const router = require('express').Router();
const PlatformConfig = require('../models/PlatformConfig');
const { auth, adminOnly } = require('../middleware/auth');

// Get all platform configs (public - enabled status + appId for OAuth)
router.get('/', async (req, res) => {
  try {
    const platforms = await PlatformConfig.find().select('platform isEnabled appId');
    res.json(platforms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Get full platform configs
router.get('/admin', auth, adminOnly, async (req, res) => {
  try {
    const platforms = await PlatformConfig.find();
    res.json(platforms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Create/Update platform config
router.put('/:platform', auth, adminOnly, async (req, res) => {
  try {
    const config = await PlatformConfig.findOneAndUpdate(
      { platform: req.params.platform },
      { ...req.body, platform: req.params.platform },
      { upsert: true, new: true }
    );
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Toggle platform
router.put('/:platform/toggle', auth, adminOnly, async (req, res) => {
  try {
    const config = await PlatformConfig.findOneAndUpdate(
      { platform: req.params.platform },
      [{ $set: { isEnabled: { $not: '$isEnabled' } } }],
      { upsert: true, new: true }
    );
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
