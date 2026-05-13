const BotTemplate = require('../models/BotTemplate');

const BUILT_IN_TEMPLATES = [
  {
    name: 'Welcome DM',
    nameAr: 'رسالة ترحيب',
    description: 'Send a welcome DM to everyone who comments',
    descriptionAr: 'إرسال رسالة ترحيب لكل من يعلق على منشوراتك',
    category: 'engagement',
    platform: 'all',
    type: 'post_dm',
    icon: '👋',
    isPremium: false,
    config: {
      useAI: false,
      allPosts: true,
      triggers: [],
      actions: [{
        type: 'dm',
        message: 'Hello! Thank you for your comment. How can we help you today?',
        messageAr: 'مرحباً! شكراً على تعليقك. كيف يمكننا مساعدتك اليوم؟',
        delay: 0,
        language: 'both'
      }]
    }
  },
  {
    name: 'Keyword Offer',
    nameAr: 'عرض بكلمة مفتاحية',
    description: 'Send special offer when someone types a keyword like "price"',
    descriptionAr: 'أرسل عرضاً خاصاً عندما يكتب أحد كلمة مثل "سعر"',
    category: 'ecommerce',
    platform: 'all',
    type: 'keyword',
    icon: '🛍️',
    isPremium: false,
    config: {
      useAI: false,
      allPosts: true,
      triggers: [{ keyword: 'price', matchType: 'contains', caseSensitive: false }, { keyword: 'سعر', matchType: 'contains', caseSensitive: false }],
      actions: [{
        type: 'dm',
        message: 'Hi! Here is our special offer just for you: [Add your offer link here]',
        messageAr: 'مرحباً! إليك عرضنا الخاص لك: [أضف رابط عرضك هنا]',
        delay: 5,
        language: 'both'
      }]
    }
  },
  {
    name: 'AI Customer Support',
    nameAr: 'دعم عملاء بالذكاء الاصطناعي',
    description: 'Use AI to answer customer questions automatically',
    descriptionAr: 'استخدم الذكاء الاصطناعي للإجابة على أسئلة العملاء تلقائياً',
    category: 'support',
    platform: 'all',
    type: 'ai',
    icon: '🧠',
    isPremium: true,
    config: {
      useAI: true,
      aiPrompt: 'You are a helpful customer service agent. Answer questions briefly and professionally in the same language the customer uses.',
      allPosts: true,
      triggers: [],
      actions: [{ type: 'dm', message: '', delay: 2, language: 'both' }]
    }
  },
  {
    name: 'Comment Reply',
    nameAr: 'رد على التعليقات',
    description: 'Auto-reply to all comments on your posts',
    descriptionAr: 'رد تلقائي على جميع التعليقات في منشوراتك',
    category: 'engagement',
    platform: 'all',
    type: 'comment_reply',
    icon: '💬',
    isPremium: false,
    config: {
      useAI: false,
      allPosts: true,
      triggers: [],
      actions: [{
        type: 'comment',
        message: 'Thank you for your comment! 🙏 We will get back to you shortly.',
        messageAr: 'شكراً على تعليقك! 🙏 سنتواصل معك قريباً.',
        delay: 10,
        language: 'both'
      }]
    }
  },
  {
    name: 'Lead Generation',
    nameAr: 'توليد العملاء المحتملين',
    description: 'Capture leads by sending a form link after comments',
    descriptionAr: 'اجمع العملاء المحتملين بإرسال رابط نموذج بعد التعليقات',
    category: 'leadgen',
    platform: 'facebook',
    type: 'post_dm',
    icon: '🎯',
    isPremium: false,
    config: {
      useAI: false,
      allPosts: true,
      triggers: [],
      actions: [{
        type: 'dm',
        message: 'Thanks for your interest! Please fill out this form and we will contact you: [Your form link]',
        messageAr: 'شكراً لاهتمامك! يرجى ملء هذا النموذج وسنتواصل معك: [رابط النموذج]',
        delay: 15,
        language: 'both'
      }]
    }
  },
  {
    name: 'Contest Entry',
    nameAr: 'المسابقة',
    description: 'Auto-confirm contest entries and DM participants',
    descriptionAr: 'تأكيد تلقائي لمشاركات المسابقة وإرسال رسالة للمشاركين',
    category: 'engagement',
    platform: 'all',
    type: 'post_dm',
    icon: '🏆',
    isPremium: false,
    config: {
      useAI: false,
      allPosts: false,
      triggers: [],
      actions: [
        { type: 'comment', message: '🎉 You are entered! Good luck!', messageAr: '🎉 تم تسجيلك! بالتوفيق!', delay: 5, language: 'both' },
        { type: 'dm', message: '🏆 You have been entered into our contest! We will announce the winner on [date]. Stay tuned!', messageAr: '🏆 تم تسجيلك في مسابقتنا! سنعلن الفائز في [التاريخ]. ابق على اطلاع!', delay: 30, language: 'both' }
      ]
    }
  },
  {
    name: 'Product Announcement',
    nameAr: 'إعلان منتج جديد',
    description: 'Reply to comments on product announcement posts',
    descriptionAr: 'رد على تعليقات منشورات الإعلان عن منتج',
    category: 'announcement',
    platform: 'all',
    type: 'comment_reply',
    icon: '📣',
    isPremium: false,
    config: {
      useAI: false,
      allPosts: false,
      triggers: [],
      actions: [{
        type: 'comment',
        message: 'Thanks for your interest! 🚀 Check the link in bio for more details.',
        messageAr: 'شكراً لاهتمامك! 🚀 تحقق من الرابط في Bio لمزيد من التفاصيل.',
        delay: 8,
        language: 'both'
      }]
    }
  },
  {
    name: 'Multilingual Support',
    nameAr: 'دعم متعدد اللغات',
    description: 'AI-powered bot that replies in the customer\'s language',
    descriptionAr: 'بوت بالذكاء الاصطناعي يرد بلغة العميل تلقائياً',
    category: 'support',
    platform: 'all',
    type: 'ai',
    icon: '🌍',
    isPremium: true,
    config: {
      useAI: true,
      aiPrompt: 'You are a multilingual support agent. Always detect the language of the incoming message and respond in the SAME language. Keep replies short, friendly, and helpful.',
      allPosts: true,
      triggers: [],
      actions: [{ type: 'dm', message: '', delay: 3, language: 'both' }]
    }
  }
];

const initTemplates = async () => {
  try {
    const count = await BotTemplate.countDocuments({ isBuiltIn: true });
    if (count === 0) {
      await BotTemplate.insertMany(BUILT_IN_TEMPLATES.map(t => ({ ...t, isBuiltIn: true })));
      console.log(`✅ Initialized ${BUILT_IN_TEMPLATES.length} bot templates`);
    }
  } catch (err) {
    console.error('Template init error:', err.message);
  }
};

module.exports = { initTemplates };
