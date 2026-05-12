const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Page' },
  platform: { type: String, enum: ['facebook', 'instagram', 'whatsapp', 'telegram', 'tiktok'] },
  postId: { type: String },
  commentId: { type: String },
  parentCommentId: { type: String },
  senderId: { type: String },
  senderName: { type: String },
  content: { type: String },
  imageUrl: { type: String },
  reply: {
    sent: { type: Boolean, default: false },
    content: { type: String },
    imageUrl: { type: String },
    sentAt: { type: Date },
    botId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bot' }
  },
  dmSent: { type: Boolean, default: false },
  dmContent: { type: String },
  dmSentAt: { type: Date },
  rawData: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);
