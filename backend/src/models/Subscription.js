const mongoose = require('mongoose');

const PLANS = {
  free: {
    name: 'Free',
    nameAr: 'مجاني',
    price: 0,
    limits: {
      bots: 2,
      pages: 2,
      messagesPerMonth: 500,
      teamMembers: 1,
      abTests: 0,
      scheduledPosts: 0,
      aiReplies: false,
      autoTranslate: false,
      pushNotifications: false,
      conversionTracking: false,
      advancedAnalytics: false,
    }
  },
  pro: {
    name: 'Pro',
    nameAr: 'احترافي',
    price: 29,
    limits: {
      bots: 20,
      pages: 10,
      messagesPerMonth: 10000,
      teamMembers: 5,
      abTests: 5,
      scheduledPosts: 50,
      aiReplies: true,
      autoTranslate: true,
      pushNotifications: true,
      conversionTracking: true,
      advancedAnalytics: true,
    }
  },
  enterprise: {
    name: 'Enterprise',
    nameAr: 'مؤسسي',
    price: 99,
    limits: {
      bots: -1,        // unlimited
      pages: -1,
      messagesPerMonth: -1,
      teamMembers: -1,
      abTests: -1,
      scheduledPosts: -1,
      aiReplies: true,
      autoTranslate: true,
      pushNotifications: true,
      conversionTracking: true,
      advancedAnalytics: true,
    }
  }
};

const subscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  plan: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
  status: { type: String, enum: ['active', 'cancelled', 'expired', 'trial'], default: 'active' },
  startedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
  upgradedByAdmin: { type: Boolean, default: false },
  upgradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  adminNote: { type: String },
  // usage counters reset monthly
  usageThisMonth: {
    messages: { type: Number, default: 0 },
    resetAt: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 3600 * 1000) }
  },
  // payment info (optional)
  paymentMethod: { type: String },
  lastPayment: { type: Date },
}, { timestamps: true });

subscriptionSchema.virtual('planDetails').get(function () {
  return PLANS[this.plan] || PLANS.free;
});

subscriptionSchema.methods.canUseFeature = function (feature) {
  const limits = PLANS[this.plan]?.limits;
  if (!limits) return false;
  return limits[feature] === true || limits[feature] === -1 || limits[feature] > 0;
};

subscriptionSchema.methods.getLimit = function (feature) {
  return PLANS[this.plan]?.limits?.[feature] ?? 0;
};

subscriptionSchema.statics.PLANS = PLANS;

module.exports = mongoose.model('Subscription', subscriptionSchema);
