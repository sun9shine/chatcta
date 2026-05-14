const router = require('express').Router();
const AIConfig = require('../models/AIConfig');
const { auth } = require('../middleware/auth');

router.use(auth);

// GET /api/ai-settings
router.get('/', async (req, res) => {
  try {
    let cfg = await AIConfig.findOne({ userId: req.user._id });
    if (!cfg) cfg = await AIConfig.create({ userId: req.user._id });
    const obj = cfg.toObject();
    // Mask API key
    if (obj.apiKey) obj.apiKey = obj.apiKey.replace(/.(?=.{4})/g, '•');
    res.json(obj);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/ai-settings
router.put('/', async (req, res) => {
  try {
    const allowed = ['provider','apiKey','baseUrl','model','temperature','maxTokens','globalSystemPrompt','replyLanguage','enabled'];
    const update = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) {
        if (k === 'apiKey' && String(req.body.apiKey).includes('•')) continue;
        update[k] = req.body[k];
      }
    }
    const cfg = await AIConfig.findOneAndUpdate(
      { userId: req.user._id },
      { $set: update },
      { upsert: true, new: true }
    );
    const obj = cfg.toObject();
    if (obj.apiKey) obj.apiKey = obj.apiKey.replace(/.(?=.{4})/g, '•');
    res.json(obj);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ai-settings/test
router.post('/test', async (req, res) => {
  try {
    const cfg = await AIConfig.findOne({ userId: req.user._id });
    if (!cfg)         return res.status(400).json({ error: 'No AI config found. Save settings first.' });
    if (!cfg.apiKey)  return res.status(400).json({ error: 'API key is required' });

    const axios = require('axios');
    const baseUrl = cfg.baseUrl || 'https://api.openai.com/v1';
    const resp = await axios.post(`${baseUrl}/chat/completions`, {
      model: cfg.model,
      messages: [
        { role: 'system', content: cfg.globalSystemPrompt || 'You are a helpful assistant.' },
        { role: 'user', content: 'Reply with exactly two words: TEST_OK' }
      ],
      max_tokens: 20, temperature: 0.1
    }, {
      headers: { Authorization: `Bearer ${cfg.apiKey}`, 'Content-Type': 'application/json' },
      timeout: 15000
    });

    const reply = resp.data?.choices?.[0]?.message?.content || '';
    await AIConfig.findOneAndUpdate({ userId: req.user._id }, {
      lastTest: { status: 'success', message: reply, testedAt: new Date() }
    });
    res.json({ success: true, reply, model: cfg.model });
  } catch (err) {
    const msg = err.response?.data?.error?.message || err.message;
    try { await AIConfig.findOneAndUpdate({ userId: req.user._id }, { lastTest: { status:'failed', message:msg, testedAt:new Date() } }); } catch(_) {}
    res.status(400).json({ error: msg });
  }
});

module.exports = router;
