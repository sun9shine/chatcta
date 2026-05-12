const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  platform: { type: String, enum: ['facebook', 'instagram', 'whatsapp', 'telegram', 'tiktok'], required: true },
  pageId: { type: String, required: true },
  pageName: { type: String, required: true },
  pageUsername: { type: String },
  pageAvatar: { type: String },
  accessToken: { type: String },
  refreshToken: { type: String },
  tokenExpiry: { type: Date },
  webhookSubscribed: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  followers: { type: Number, default: 0 },
  metadata: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

pageSchema.index({ userId: 1, platform: 1, pageId: 1 }, { unique: true });

module.exports = mongoose.model('Page', pageSchema);
