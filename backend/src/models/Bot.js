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
    // ── single reply (legacy / DM / reaction) ──────────────
    message:  { type: String },
    imageUrl: { type: String },
    linkUrl:  { type: String },
    linkText: { type: String },
    delay:    { type: Number, default: 0 }, // seconds (used when replies array is empty)
    language: { type: String, enum: ['ar', 'en', 'both'], default: 'both' },
    // ── multiple comment replies ────────────────────────────
    // Each entry is one reply sent in sequence with its own delay
    replies: [{
      message:        { type: String, default: '' },
      imageUrl:       { type: String, default: '' },
      linkUrl:        { type: String, default: '' },
      linkText:       { type: String, default: '' },
      delayEnabled:   { type: Boolean, default: false }, // toggle for delay
      delay:          { type: Number,  default: 0 },     // seconds (used only when delayEnabled=true)
      isEnabled:      { type: Boolean, default: true },  // can disable individual reply without deleting
      order:          { type: Number,  default: 0 }
    }]
  }],
  stats: {
    totalReplies: { type: Number, default: 0 },
    totalDMs: { type: Number, default: 0 },
    lastRun: { type: Date }
  }
}, { timestamps: true });

module.exports = mongoose.model('Bot', botSchema);
