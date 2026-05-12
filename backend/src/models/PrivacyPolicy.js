const mongoose = require('mongoose');

const privacyPolicySchema = new mongoose.Schema({
  content: { type: String, required: true },
  contentAr: { type: String },
  version: { type: String, default: '1.0' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('PrivacyPolicy', privacyPolicySchema);
