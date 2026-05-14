const mongoose = require('mongoose');

const aiConfigSchema = new mongoose.Schema({
  userId:             { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  provider:           { type: String, default: 'openai' },
  apiKey:             { type: String, default: '' },
  baseUrl:            { type: String, default: '' },
  model:              { type: String, default: 'gpt-3.5-turbo' },
  temperature:        { type: Number, default: 0.7 },
  maxTokens:          { type: Number, default: 300 },
  globalSystemPrompt: { type: String, default: '' },
  replyLanguage:      { type: String, enum: ['ar','en','auto'], default: 'auto' },
  enabled:            { type: Boolean, default: false },
  lastTest: {
    status:   { type: String, enum: ['success','failed','untested'], default: 'untested' },
    message:  { type: String, default: '' },
    testedAt: { type: Date }
  }
}, { timestamps: true });

module.exports = mongoose.model('AIConfig', aiConfigSchema);
