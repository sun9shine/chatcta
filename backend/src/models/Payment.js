const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  gatewayId: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentGateway' },
  provider:  { type: String, enum: ['paypal', 'stripe', 'manual', 'admin'], required: true },

  // Payment details
  amount:    { type: Number, required: true },
  currency:  { type: String, default: 'USD' },
  plan:      { type: String, enum: ['free', 'pro', 'enterprise'], required: true },

  // Status
  status:    { type: String, enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'], default: 'pending' },

  // Provider transaction IDs
  transactionId:  { type: String }, // PayPal order ID or Stripe payment_intent
  providerData:   { type: mongoose.Schema.Types.Mixed }, // raw webhook data

  // Admin manual upgrade
  isManualUpgrade: { type: Boolean, default: false },
  upgradedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  adminNote:       { type: String },

  // Dates
  paidAt:     { type: Date },
  expiresAt:  { type: Date },
  refundedAt: { type: Date },

}, { timestamps: true });

paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
