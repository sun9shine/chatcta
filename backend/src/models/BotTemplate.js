const mongoose = require('mongoose');

const botTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nameAr: { type: String },
  description: { type: String },
  descriptionAr: { type: String },
  category: { type: String, enum: ['ecommerce', 'service', 'engagement', 'leadgen', 'support', 'announcement', 'custom'], default: 'custom' },
  platform: { type: String, enum: ['facebook', 'instagram', 'whatsapp', 'telegram', 'tiktok', 'all'], default: 'all' },
  type: { type: String, enum: ['comment_reply', 'dm_reply', 'post_dm', 'keyword', 'ai', 'sequence'], default: 'comment_reply' },
  icon: { type: String, default: '🤖' },
  isPremium: { type: Boolean, default: false },
  isBuiltIn: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // null = system
  usageCount: { type: Number, default: 0 },
  config: {
    useAI: { type: Boolean, default: false },
    aiPrompt: { type: String },
    allPosts: { type: Boolean, default: true },
    triggers: [{ keyword: String, matchType: String, caseSensitive: Boolean }],
    actions: [{
      type: { type: String },
      message: { type: String },
      messageAr: { type: String },
      imageUrl: { type: String },
      delay: { type: Number, default: 0 },
      language: { type: String, default: 'both' }
    }]
  }
}, { timestamps: true });

module.exports = mongoose.model('BotTemplate', botTemplateSchema);
