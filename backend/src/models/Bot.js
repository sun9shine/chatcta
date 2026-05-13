const mongoose = require('mongoose');

const botSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Page' },
  name: { type: String, required: true },
  platform: { type: String, enum: ['facebook', 'instagram', 'whatsapp', 'telegram', 'tiktok', 'all'] },
  type: { type: String, enum: ['comment_reply', 'dm_reply', 'post_dm', 'keyword', 'ai', 'sequence'], default: 'comment_reply' },
  isActive: { type: Boolean, default: true },
  useAI: { type: Boolean, default: false },
  aiPrompt: { type: String },
  triggers: [{
    keyword: { type: String },
    matchType: { type: String, enum: ['exact', 'contains', 'starts_with', 'regex'], default: 'contains' },
    caseSensitive: { type: Boolean, default: false }
  }],
  targetPosts: [{ type: String }], // post IDs
  allPosts: { type: Boolean, default: false },
  actions: [{
    type: { type: String, enum: ['comment', 'dm', 'reaction', 'tag'], default: 'comment' },
    message: { type: String },
    imageUrl: { type: String },
    linkUrl: { type: String }, // optional link to include in message
    linkText: { type: String }, // optional link display text
    delay: { type: Number, default: 0 }, // seconds
    language: { type: String, enum: ['ar', 'en', 'both'], default: 'both' }
  }],
  stats: {
    totalReplies: { type: Number, default: 0 },
    totalDMs: { type: Number, default: 0 },
    lastRun: { type: Date }
  }
}, { timestamps: true });

module.exports = mongoose.model('Bot', botSchema);
