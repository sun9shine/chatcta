const router = require('express').Router();
const PrivacyPolicy = require('../models/PrivacyPolicy');
const { auth, adminOnly } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const policy = await PrivacyPolicy.findOne().sort('-createdAt');
    if (!policy) return res.json({ content: 'Privacy Policy not set yet.', contentAr: 'لم يتم تعيين سياسة الخصوصية بعد.' });
    res.json(policy);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/', auth, adminOnly, async (req, res) => {
  try {
    const policy = await PrivacyPolicy.findOneAndUpdate(
      {},
      { ...req.body, updatedBy: req.user._id },
      { upsert: true, new: true }
    );
    res.json(policy);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
