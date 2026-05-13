const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  phone: { type: String },
  avatar: { type: String },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false },
  banReason: { type: String },
  language: { type: String, enum: ['ar', 'en'], default: 'ar' },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  lastLogin: { type: Date },
  // Subscription shortcut (cached)
  plan: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
  planExpiresAt: { type: Date },
  // Team: owner or member
  teamOwnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // if this user is a team member
  connectedPlatforms: [{
    platform: { type: String, enum: ['facebook', 'instagram', 'whatsapp', 'telegram', 'tiktok'] },
    accessToken: { type: String },
    pageId: { type: String },
    pageName: { type: String },
    connectedAt: { type: Date, default: Date.now }
  }],
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
