const mongoose = require('mongoose');

const abTestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  botId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bot' },
  name: { type: String, required: true },
  platform: { type: String },
  isActive: { type: Boolean, default: true },
  variants: [{
    label: { type: String, required: true }, // e.g. "Variant A"
    message: { type: String, required: true },
    imageUrl: { type: String },
    weight: { type: Number, default: 50 }, // percentage
    stats: {
      sent: { type: Number, default: 0 },
      replies: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
      ctr: { type: Number, default: 0 } // reply rate %
    }
  }],
  winner: { type: String }, // variant label of winner
  decidedAt: { type: Date },
  totalSent: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('ABTest', abTestSchema);
