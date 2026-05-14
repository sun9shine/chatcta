const mongoose = require('mongoose');

// ── Sub-schema: one named model entry ──────────────────────────────────────
const modelEntrySchema = new mongoose.Schema({
  name:     { type: String, required: true },         // Display name (e.g. "GPT-4 Fast", "ردود العملاء")
  provider: { type: String, default: 'openai' },      // openai | deepseek | gemini | anthropic | custom
  apiKey:   { type: String, default: '' },
  baseUrl:  { type: String, default: '' },
  model:    { type: String, default: 'gpt-3.5-turbo' },
  temperature:  { type: Number, default: 0.7 },
  maxTokens:    { type: Number, default: 300 },
  systemPrompt: { type: String, default: '' },
  replyLanguage: { type: String, enum: ['ar','en','auto'], default: 'auto' },
  isDefault:    { type: Boolean, default: false },
  isEnabled:    { type: Boolean, default: true },
}, { _id: true });

// ── Main AI config (global — managed by admin) ────────────────────────────
const aiConfigSchema = new mongoose.Schema({
  globalEnabled: { type: Boolean, default: false },
  models: [modelEntrySchema],
  defaultModelId: { type: mongoose.Schema.Types.ObjectId },
  lastTest: {
    status:    { type: String, enum: ['success','failed','untested'], default: 'untested' },
    message:   { type: String, default: '' },
    modelName: { type: String, default: '' },
    testedAt:  { type: Date }
  }
}, { timestamps: true });

module.exports = mongoose.model('AIConfig', aiConfigSchema);
