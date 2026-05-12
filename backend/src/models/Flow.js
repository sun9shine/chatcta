const mongoose = require('mongoose');

const flowSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Page' },
  name: { type: String, required: true },
  platform: { type: String, enum: ['facebook', 'instagram', 'whatsapp', 'telegram', 'tiktok'] },
  type: { type: String, enum: ['comment', 'message'], default: 'message' },
  isActive: { type: Boolean, default: true },
  trigger: {
    type: { type: String, enum: ['keyword', 'any', 'first_message', 'post_comment'], default: 'any' },
    keywords: [{ type: String }],
    postId: { type: String }
  },
  steps: [{
    order: { type: Number },
    type: { type: String, enum: ['text', 'image', 'delay', 'condition', 'ai'], default: 'text' },
    content: { type: String },
    imageUrl: { type: String },
    delay: { type: Number, default: 0 }, // seconds
    condition: { type: mongoose.Schema.Types.Mixed },
    aiPrompt: { type: String }
  }],
  stats: {
    triggered: { type: Number, default: 0 },
    completed: { type: Number, default: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model('Flow', flowSchema);
