const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // account owner
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },  // invited user (after accepting)
  email: { type: String, required: true },
  role: { type: String, enum: ['viewer', 'editor', 'manager'], default: 'editor' },
  permissions: {
    viewBots: { type: Boolean, default: true },
    editBots: { type: Boolean, default: true },
    viewMessages: { type: Boolean, default: true },
    sendMessages: { type: Boolean, default: false },
    viewAnalytics: { type: Boolean, default: true },
    managePages: { type: Boolean, default: false },
    manageFlows: { type: Boolean, default: true },
  },
  status: { type: String, enum: ['pending', 'active', 'rejected'], default: 'pending' },
  inviteToken: { type: String },
  inviteExpires: { type: Date },
  joinedAt: { type: Date },
}, { timestamps: true });

teamMemberSchema.index({ ownerId: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('TeamMember', teamMemberSchema);
