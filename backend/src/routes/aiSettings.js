const router = require('express').Router();
const AIConfig = require('../models/AIConfig');
const { auth, adminOnly } = require('../middleware/auth');

router.use(auth, adminOnly);

// ─── Helper: get or create singleton config ────────────────────────────────
async function getConfig() {
  let cfg = await AIConfig.findOne();
  if (!cfg) cfg = await AIConfig.create({ globalEnabled: false, models: [] });
  return cfg;
}

// Mask API key for frontend display
function maskKey(key) {
  if (!key || key.length < 8) return key;
  return key.slice(0, 4) + '•'.repeat(key.length - 8) + key.slice(-4);
}

// ─── GET /api/ai-settings — load config ────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const cfg = await getConfig();
    const obj = cfg.toObject();
    // Mask all API keys
    obj.models = obj.models.map(m => ({ ...m, apiKey: maskKey(m.apiKey) }));
    res.json(obj);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── PUT /api/ai-settings — update global settings ─────────────────────────
router.put('/', async (req, res) => {
  try {
    const { globalEnabled, defaultModelId } = req.body;
    const cfg = await getConfig();
    if (globalEnabled !== undefined) cfg.globalEnabled = globalEnabled;
    if (defaultModelId) cfg.defaultModelId = defaultModelId;
    await cfg.save();
    const obj = cfg.toObject();
    obj.models = obj.models.map(m => ({ ...m, apiKey: maskKey(m.apiKey) }));
    res.json(obj);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── POST /api/ai-settings/models — add a new model ───────────────────────
router.post('/models', async (req, res) => {
  try {
    const { name, provider, apiKey, baseUrl, model, temperature, maxTokens, systemPrompt, replyLanguage, isDefault } = req.body;
    if (!name) return res.status(400).json({ error: 'Model name is required' });
    const cfg = await getConfig();
    // If marking as default, unset others
    if (isDefault) cfg.models.forEach(m => m.isDefault = false);
    cfg.models.push({ name, provider, apiKey, baseUrl, model, temperature, maxTokens, systemPrompt, replyLanguage, isDefault: isDefault || cfg.models.length === 0, isEnabled: true });
    if (isDefault || cfg.models.length === 1) cfg.defaultModelId = cfg.models[cfg.models.length - 1]._id;
    await cfg.save();
    const obj = cfg.toObject();
    obj.models = obj.models.map(m => ({ ...m, apiKey: maskKey(m.apiKey) }));
    res.json(obj);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── PUT /api/ai-settings/models/:modelId — update a model ─────────────────
router.put('/models/:modelId', async (req, res) => {
  try {
    const cfg = await getConfig();
    const m = cfg.models.id(req.params.modelId);
    if (!m) return res.status(404).json({ error: 'Model not found' });
    const allowed = ['name','provider','apiKey','baseUrl','model','temperature','maxTokens','systemPrompt','replyLanguage','isDefault','isEnabled'];
    for (const k of allowed) {
      if (req.body[k] !== undefined) {
        // Don't overwrite key if masked value sent back
        if (k === 'apiKey' && String(req.body.apiKey).includes('•')) continue;
        m[k] = req.body[k];
      }
    }
    if (req.body.isDefault) {
      cfg.models.forEach(x => { if (x._id.toString() !== m._id.toString()) x.isDefault = false; });
      cfg.defaultModelId = m._id;
    }
    await cfg.save();
    const obj = cfg.toObject();
    obj.models = obj.models.map(x => ({ ...x, apiKey: maskKey(x.apiKey) }));
    res.json(obj);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── DELETE /api/ai-settings/models/:modelId — remove a model ──────────────
router.delete('/models/:modelId', async (req, res) => {
  try {
    const cfg = await getConfig();
    cfg.models = cfg.models.filter(m => m._id.toString() !== req.params.modelId);
    if (cfg.defaultModelId?.toString() === req.params.modelId && cfg.models.length > 0) {
      cfg.models[0].isDefault = true;
      cfg.defaultModelId = cfg.models[0]._id;
    }
    await cfg.save();
    const obj = cfg.toObject();
    obj.models = obj.models.map(m => ({ ...m, apiKey: maskKey(m.apiKey) }));
    res.json(obj);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── POST /api/ai-settings/test/:modelId — test a specific model ───────────
router.post('/test/:modelId', async (req, res) => {
  try {
    const cfg = await getConfig();
    const m = cfg.models.id(req.params.modelId);
    if (!m) return res.status(404).json({ error: 'Model not found' });
    if (!m.apiKey) return res.status(400).json({ error: 'API key is required for this model' });

    const axios = require('axios');
    const baseUrl = m.baseUrl || 'https://api.openai.com/v1';
    const resp = await axios.post(`${baseUrl}/chat/completions`, {
      model: m.model,
      messages: [
        { role: 'system', content: m.systemPrompt || 'You are a helpful assistant.' },
        { role: 'user', content: 'Reply with exactly: TEST_OK' }
      ],
      max_tokens: 20, temperature: 0.1
    }, {
      headers: { Authorization: `Bearer ${m.apiKey}`, 'Content-Type': 'application/json' },
      timeout: 15000
    });

    const reply = resp.data?.choices?.[0]?.message?.content || '';
    cfg.lastTest = { status: 'success', message: reply, modelName: m.name, testedAt: new Date() };
    await cfg.save();
    res.json({ success: true, reply, model: m.model, name: m.name });
  } catch (err) {
    const msg = err.response?.data?.error?.message || err.message;
    try {
      const cfg = await getConfig();
      cfg.lastTest = { status: 'failed', message: msg, modelName: '', testedAt: new Date() };
      await cfg.save();
    } catch (_) {}
    res.status(400).json({ error: msg });
  }
});

module.exports = router;
