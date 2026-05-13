const mongoose = require('mongoose');

const scheduledPostSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pageIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Page' }],
  platforms: [{ type: String, enum: ['facebook', 'instagram', 'whatsapp', 'telegram', 'tiktok'] }],
  content: { type: String, required: true },
  imageUrl: { type: String },
  scheduledAt: { type: Date, required: true },
  timezone: { type: String, default: 'UTC' },
  status: { type: String, enum: ['pending', 'published', 'failed', 'cancelled'], default: 'pending' },
  publishedAt: { type: Date },
  results: [{
    pageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Page' },
    pageName: { type: String },
    platform: { type: String },
    status: { type: String, enum: ['success', 'failed'] },
    error: { type: String },
    postId: { type: String }
  }],
  repeat: {
    enabled: { type: Boolean, default: false },
    interval: { type: String, enum: ['daily', 'weekly', 'monthly'] },
    endAt: { type: Date }
  }
}, { timestamps: true });

scheduledPostSchema.index({ scheduledAt: 1, status: 1 });

module.exports = mongoose.model('ScheduledPost', scheduledPostSchema);
