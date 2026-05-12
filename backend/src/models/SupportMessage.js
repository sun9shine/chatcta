const mongoose = require('mongoose');

const supportMessageSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // null = admin
  isAdminReply: { type: Boolean, default: false },
  subject: { type: String },
  content: { type: String, required: true },
  attachments: [{ type: String }],
  isRead: { type: Boolean, default: false },
  threadId: { type: String }, // group messages into threads
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'SupportMessage' }
}, { timestamps: true });

module.exports = mongoose.model('SupportMessage', supportMessageSchema);
