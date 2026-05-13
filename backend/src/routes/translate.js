const router = require('express').Router();
const axios = require('axios');
const { auth } = require('../middleware/auth');

router.use(auth);

// Translate text using LibreTranslate (free) or DeepL/Google if configured
router.post('/', async (req, res) => {
  try {
    const { text, from = 'auto', to } = req.body;
    if (!text || !to) return res.status(400).json({ error: 'text and to required' });

    let translated = text;

    // Try OpenAI translation if API key exists
    if (process.env.OPENAI_API_KEY) {
      const { OpenAI } = require('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const langName = to === 'ar' ? 'Arabic' : to === 'en' ? 'English' : to;
      const resp = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: `Translate the following text to ${langName}. Only return the translated text, nothing else.` },
          { role: 'user', content: text }
        ],
        max_tokens: 500
      });
      translated = resp.choices[0].message.content.trim();
    } else if (process.env.LIBRE_TRANSLATE_URL) {
      // LibreTranslate self-hosted
      const resp = await axios.post(`${process.env.LIBRE_TRANSLATE_URL}/translate`, {
        q: text, source: from, target: to, format: 'text'
      });
      translated = resp.data.translatedText;
    } else {
      // Fallback: return original + note
      translated = text;
      return res.json({ translated, note: 'No translation service configured. Add OPENAI_API_KEY or LIBRE_TRANSLATE_URL.' });
    }

    res.json({ translated, from, to });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Batch translate
router.post('/batch', async (req, res) => {
  try {
    const { texts, to } = req.body;
    if (!texts?.length || !to) return res.status(400).json({ error: 'texts array and to required' });

    if (!process.env.OPENAI_API_KEY) {
      return res.json({ results: texts.map(t => ({ original: t, translated: t })) });
    }

    const { OpenAI } = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const langName = to === 'ar' ? 'Arabic' : to === 'en' ? 'English' : to;

    const results = [];
    for (const text of texts.slice(0, 20)) { // limit to 20
      const resp = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: `Translate to ${langName}. Return only the translation.` },
          { role: 'user', content: text }
        ],
        max_tokens: 300
      });
      results.push({ original: text, translated: resp.choices[0].message.content.trim() });
    }

    res.json({ results });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
