import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  ar: {
    translation: {
      // General
      appName: 'ChatCTA',
      tagline: 'أتمتة ذكية لوسائل التواصل الاجتماعي',
      start: 'ابدأ الآن',
      login: 'تسجيل الدخول',
      register: 'إنشاء حساب',
      logout: 'تسجيل الخروج',
      save: 'حفظ',
      cancel: 'إلغاء',
      delete: 'حذف',
      edit: 'تعديل',
      add: 'إضافة',
      search: 'بحث...',
      loading: 'جاري التحميل...',
      confirm: 'تأكيد',
      yes: 'نعم',
      no: 'لا',
      active: 'نشط',
      inactive: 'غير نشط',
      enabled: 'مفعل',
      disabled: 'معطل',
      connected: 'متصل',
      disconnected: 'غير متصل',
      actions: 'الإجراءات',
      status: 'الحالة',
      name: 'الاسم',
      email: 'البريد الإلكتروني',
      password: 'كلمة المرور',
      phone: 'رقم الهاتف',
      language: 'اللغة',
      arabic: 'العربية',
      english: 'الإنجليزية',
      platform: 'المنصة',
      
      // Navigation
      dashboard: 'لوحة التحكم',
      connectedPages: 'الصفحات المرتبطة',
      bots: 'البوتات',
      messageFlow: 'تدفق الرسائل',
      commentFlow: 'تدفق التعليقات',
      support: 'الدعم الفني',
      profile: 'الملف الشخصي',
      settings: 'الإعدادات',
      adminPanel: 'لوحة الأدمن',
      users: 'المستخدمون',
      platforms: 'المنصات',
      smtp: 'إعدادات البريد',
      announcements: 'الإعلانات',
      privacy: 'سياسة الخصوصية',
      analytics: 'الإحصائيات',
      dataExport: 'تصدير البيانات',
      publish: 'النشر',
      
      // Auth
      welcomeBack: 'مرحباً بعودتك',
      createAccount: 'إنشاء حساب جديد',
      emailAddress: 'البريد الإلكتروني',
      passwordLabel: 'كلمة المرور',
      confirmPassword: 'تأكيد كلمة المرور',
      fullName: 'الاسم الكامل',
      forgotPassword: 'نسيت كلمة المرور؟',
      resetPassword: 'إعادة تعيين كلمة المرور',
      noAccount: 'ليس لديك حساب؟',
      haveAccount: 'لديك حساب بالفعل؟',
      
      // Dashboard
      totalPages: 'الصفحات المرتبطة',
      activeBots: 'البوتات النشطة',
      autoReplies: 'الردود التلقائية',
      autoMessages: 'الرسائل التلقائية',
      recentActivity: 'النشاط الأخير',
      
      // Pages
      connectPage: 'ربط صفحة',
      myPages: 'صفحاتي',
      disconnect: 'قطع الاتصال',
      reconnect: 'إعادة الاتصال',
      
      // Bots
      createBot: 'إنشاء بوت',
      botName: 'اسم البوت',
      botType: 'نوع البوت',
      commentReply: 'رد على التعليقات',
      dmReply: 'رد على الرسائل',
      postDm: 'رسالة بعد التعليق',
      useAI: 'استخدام الذكاء الاصطناعي',
      
      // Platforms
      facebook: 'فيسبوك',
      instagram: 'إنستغرام',
      whatsapp: 'واتساب',
      telegram: 'تيليجرام',
      tiktok: 'تيك توك',
      
      // Announcements
      newAnnouncement: 'إعلان جديد',
      announceToAll: 'إرسال لجميع المستخدمين',
      
      // Support
      sendMessage: 'إرسال رسالة',
      typeMessage: 'اكتب رسالتك...',
      
      // Profile
      updateProfile: 'تحديث الملف الشخصي',
      changePassword: 'تغيير كلمة المرور',
      deleteAccount: 'حذف الحساب',
      
      // Privacy
      privacyPolicy: 'سياسة الخصوصية',
      lastUpdated: 'آخر تحديث',
    }
  },
  en: {
    translation: {
      appName: 'ChatCTA',
      tagline: 'Smart Social Media Automation',
      start: 'Get Started',
      login: 'Login',
      register: 'Register',
      logout: 'Logout',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      search: 'Search...',
      loading: 'Loading...',
      confirm: 'Confirm',
      yes: 'Yes',
      no: 'No',
      active: 'Active',
      inactive: 'Inactive',
      enabled: 'Enabled',
      disabled: 'Disabled',
      connected: 'Connected',
      disconnected: 'Disconnected',
      actions: 'Actions',
      status: 'Status',
      name: 'Name',
      email: 'Email',
      password: 'Password',
      phone: 'Phone',
      language: 'Language',
      arabic: 'Arabic',
      english: 'English',
      platform: 'Platform',
      dashboard: 'Dashboard',
      connectedPages: 'Connected Pages',
      bots: 'Bots',
      messageFlow: 'Message Flow',
      commentFlow: 'Comment Flow',
      support: 'Support',
      profile: 'Profile',
      settings: 'Settings',
      adminPanel: 'Admin Panel',
      users: 'Users',
      platforms: 'Platforms',
      smtp: 'Email Settings',
      announcements: 'Announcements',
      privacy: 'Privacy Policy',
      analytics: 'Analytics',
      dataExport: 'Data Export',
      publish: 'Publish',
      welcomeBack: 'Welcome Back',
      createAccount: 'Create Account',
      emailAddress: 'Email Address',
      passwordLabel: 'Password',
      confirmPassword: 'Confirm Password',
      fullName: 'Full Name',
      forgotPassword: 'Forgot Password?',
      resetPassword: 'Reset Password',
      noAccount: "Don't have an account?",
      haveAccount: 'Already have an account?',
      totalPages: 'Connected Pages',
      activeBots: 'Active Bots',
      autoReplies: 'Auto Replies',
      autoMessages: 'Auto Messages',
      recentActivity: 'Recent Activity',
      connectPage: 'Connect Page',
      myPages: 'My Pages',
      disconnect: 'Disconnect',
      reconnect: 'Reconnect',
      createBot: 'Create Bot',
      botName: 'Bot Name',
      botType: 'Bot Type',
      commentReply: 'Comment Reply',
      dmReply: 'DM Reply',
      postDm: 'Post Comment DM',
      useAI: 'Use AI',
      facebook: 'Facebook',
      instagram: 'Instagram',
      whatsapp: 'WhatsApp',
      telegram: 'Telegram',
      tiktok: 'TikTok',
      newAnnouncement: 'New Announcement',
      announceToAll: 'Send to All Users',
      sendMessage: 'Send Message',
      typeMessage: 'Type your message...',
      updateProfile: 'Update Profile',
      changePassword: 'Change Password',
      deleteAccount: 'Delete Account',
      privacyPolicy: 'Privacy Policy',
      lastUpdated: 'Last Updated',
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ar',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'chatcta_lang'
    }
  });

export default i18n;
