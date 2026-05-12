const mongoose = require('mongoose');

const platformConfigSchema = new mongoose.Schema({
  platform: { type: String, enum: ['facebook', 'instagram', 'whatsapp', 'telegram', 'tiktok'], unique: true },
  isEnabled: { type: Boolean, default: false },
  appId: { type: String },
  appSecret: { type: String },
  accessToken: { type: String },
  verifyToken: { type: String },
  webhookUrl: { type: String },
  apiVersion: { type: String },
  businessAccountId: { type: String },
  phoneNumberId: { type: String },
  botToken: { type: String }, // Telegram
  clientKey: { type: String }, // TikTok
  clientSecret: { type: String }, // TikTok
  scopes: [{ type: String }],
  metadata: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

module.exports = mongoose.model('PlatformConfig', platformConfigSchema);
