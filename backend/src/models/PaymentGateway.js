const mongoose = require('mongoose');

const paymentGatewaySchema = new mongoose.Schema({
  name:      { type: String, required: true }, // e.g. "PayPal Main", "Stripe USD"
  provider:  { type: String, enum: ['paypal', 'stripe', 'manual', 'custom'], required: true },
  isEnabled: { type: Boolean, default: false },

  // PayPal
  paypal: {
    clientId:     { type: String, default: '' },
    clientSecret: { type: String, default: '' },
    mode:         { type: String, enum: ['sandbox', 'live'], default: 'sandbox' },
    webhookId:    { type: String, default: '' },
  },

  // Stripe
  stripe: {
    publishableKey:   { type: String, default: '' },
    secretKey:        { type: String, default: '' },
    webhookSecret:    { type: String, default: '' },
  },

  // Custom / Manual
  custom: {
    instructions:   { type: String, default: '' }, // e.g. "Transfer to bank account XXX"
    instructionsAr: { type: String, default: '' },
    apiUrl:         { type: String, default: '' },
    apiKey:         { type: String, default: '' },
    webhookSecret:  { type: String, default: '' },
  },

  // Webhook URL (auto-generated)
  webhookUrl: { type: String, default: '' },

  // Supported currencies
  currencies: [{ type: String }], // ['USD', 'EUR', 'SAR']

  // Stats
  totalPayments:  { type: Number, default: 0 },
  totalRevenue:   { type: Number, default: 0 },
  lastPaymentAt:  { type: Date },

}, { timestamps: true });

module.exports = mongoose.model('PaymentGateway', paymentGatewaySchema);
