const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Page' },
  platform: { type: String, enum: ['facebook', 'instagram', 'whatsapp', 'telegram', 'tiktok'] },
  type: { type: String, enum: ['incoming', 'outgoing', 'system'], default: 'incoming' },
  senderId: { type: String },
  senderName: { type: String },
  senderAvatar: { type: String },
  recipientId: { type: String },
  content: { type: String },
  imageUrl: { type: String },
  postId: { type: String }, // for comment DMs
  isAutoReply: { type: Boolean, default: false },
  botId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bot' },
  status: { type: String, enum: ['pending', 'sent', 'delivered', 'failed'], default: 'pending' },
  scheduledAt: { type: Date },
  sentAt: { type: Date },
  errorMessage: { type: String },
  rawData: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
