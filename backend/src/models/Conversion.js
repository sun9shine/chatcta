const mongoose = require('mongoose');

const conversionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  botId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bot' },
  pageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Page' },
  abTestId: { type: mongoose.Schema.Types.ObjectId, ref: 'ABTest' },
  abVariant: { type: String },
  platform: { type: String },
  senderId: { type: String },
  senderName: { type: String },
  // What triggered this conversion
  triggerType: { type: String, enum: ['comment', 'dm', 'link_click', 'purchase', 'signup', 'custom'], default: 'dm' },
  // Conversion event
  eventType: { type: String, enum: ['reply', 'link_click', 'purchase', 'form_submit', 'custom'], default: 'reply' },
  eventValue: { type: Number, default: 0 }, // monetary value if any
  currency: { type: String, default: 'USD' },
  trackingId: { type: String }, // unique ID passed in messages
  metadata: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

conversionSchema.index({ userId: 1, createdAt: -1 });
conversionSchema.index({ botId: 1 });
conversionSchema.index({ trackingId: 1 });

module.exports = mongoose.model('Conversion', conversionSchema);
