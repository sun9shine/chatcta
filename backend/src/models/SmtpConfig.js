const mongoose = require('mongoose');

const smtpConfigSchema = new mongoose.Schema({
  host: { type: String, required: true },
  port: { type: Number, default: 587 },
  secure: { type: Boolean, default: false },
  user: { type: String, required: true },
  password: { type: String, required: true },
  fromName: { type: String, default: 'ChatCTA' },
  fromEmail: { type: String },
  isActive: { type: Boolean, default: true },
  lastTested: { type: Date },
  testStatus: { type: String, enum: ['success', 'failed', 'untested'], default: 'untested' }
}, { timestamps: true });

module.exports = mongoose.model('SmtpConfig', smtpConfigSchema);
