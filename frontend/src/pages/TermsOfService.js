import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function TermsOfService() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const contentAr = `# شروط الخدمة

## 1. القبول
باستخدامك لمنصة ChatCTA، فإنك توافق على هذه الشروط. إذا لم توافق، يرجى عدم استخدام المنصة.

## 2. وصف الخدمة
ChatCTA هي منصة لأتمتة الردود والرسائل على وسائل التواصل الاجتماعي (فيسبوك، إنستغرام، واتساب، تيليجرام، تيك توك).

## 3. حسابك
- أنت مسؤول عن الحفاظ على أمان حسابك وكلمة مرورك.
- يجب أن تكون المعلومات المقدمة صحيحة ومحدّثة.
- لا يجوز مشاركة حسابك مع آخرين.

## 4. الاستخدام المقبول
- يُحظر استخدام المنصة لإرسال رسائل مزعجة (Spam).
- يُحظر انتهاك سياسات منصات التواصل الاجتماعي.
- يُحظر استخدام المنصة لأغراض غير قانونية.
- يُحظر محاولة الوصول غير المصرّح به لحسابات الآخرين.

## 5. ربط الحسابات
- عند ربط حساباتك على وسائل التواصل الاجتماعي، فإنك تمنحنا الإذن لإرسال واستقبال الرسائل نيابة عنك.
- نلتزم بسياسات كل منصة (Meta، Telegram، TikTok).
- يمكنك قطع الاتصال في أي وقت.

## 6. الخطط والاشتراكات
- الخطة المجانية محدودة العدد من البوتات والرسائل.
- الخطط المدفوعة تُجدد شهرياً ما لم يتم إلغاؤها.
- يحق للأدمن ترقية خطتك مجاناً.

## 7. حقوق الملكية الفكرية
- المنصة وكودها ملك لـ ChatCTA.
- المحتوى الذي تنشئه (ردود، بوتات) يبقى ملكك.

## 8. إخلاء المسؤولية
- نقدم الخدمة "كما هي" بدون ضمانات.
- لا نتحمل مسؤولية أي أضرار ناتجة عن استخدام المنصة.
- لا نضمن عمل المنصة بشكل متواصل بدون انقطاع.

## 9. الإنهاء
- يحق لنا إيقاف حسابك إذا انتهكت هذه الشروط.
- يحق لك حذف حسابك في أي وقت من صفحة حذف البيانات.

## 10. التعديلات
- يحق لنا تعديل هذه الشروط في أي وقت.
- سيتم إخطارك بالتغييرات الجوهرية عبر الإعلانات داخل المنصة.

## 11. التواصل
للاستفسارات حول شروط الخدمة، تواصل معنا عبر صفحة الدعم الفني.`;

  const contentEn = `# Terms of Service

## 1. Acceptance
By using ChatCTA, you agree to these terms. If you do not agree, please do not use the platform.

## 2. Service Description
ChatCTA is a platform for automating replies and messages on social media (Facebook, Instagram, WhatsApp, Telegram, TikTok).

## 3. Your Account
- You are responsible for maintaining the security of your account and password.
- Information provided must be accurate and up-to-date.
- Account sharing is not permitted.

## 4. Acceptable Use
- Sending spam or unsolicited messages is prohibited.
- Violating social media platform policies is prohibited.
- Using the platform for illegal purposes is prohibited.
- Unauthorized access to other users' accounts is prohibited.

## 5. Account Linking
- By connecting your social media accounts, you authorize us to send and receive messages on your behalf.
- We comply with each platform's policies (Meta, Telegram, TikTok).
- You can disconnect at any time.

## 6. Plans & Subscriptions
- The free plan has limited bots and messages.
- Paid plans renew monthly unless cancelled.
- Admin may upgrade your plan for free.

## 7. Intellectual Property
- The platform and its code belong to ChatCTA.
- Content you create (replies, bots) remains yours.

## 8. Disclaimer
- The service is provided "as is" without warranties.
- We are not liable for any damages resulting from platform use.
- We do not guarantee uninterrupted service.

## 9. Termination
- We may suspend your account if you violate these terms.
- You may delete your account at any time via the Data Deletion page.

## 10. Modifications
- We may modify these terms at any time.
- Material changes will be communicated via in-app announcements.

## 11. Contact
For questions about these terms, contact us via the Support page.`;

  const content = isAr ? contentAr : contentEn;

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', padding: '40px 20px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>💬</div>
            <span style={{ fontWeight: 800, fontSize: 18, background: 'linear-gradient(135deg,#818cf8,#c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ChatCTA</span>
          </Link>
          <button onClick={() => { const n = isAr ? 'en' : 'ar'; i18n.changeLanguage(n); document.documentElement.dir = n === 'ar' ? 'rtl' : 'ltr'; }} className="btn btn-outline btn-sm">{isAr ? 'EN' : 'عربي'}</button>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid #334155' }}>
            <h1 style={{ fontSize: 22, fontWeight: 800 }}>📋 {isAr ? 'شروط الخدمة' : 'Terms of Service'}</h1>
          </div>
          <div style={{ lineHeight: 2, fontSize: 15, color: '#cbd5e1' }}>
            {content.split('\n').map((line, i) => {
              if (line.startsWith('## ')) return <h3 key={i} style={{ fontSize: 16, fontWeight: 700, marginTop: 24, marginBottom: 8, color: '#f1f5f9' }}>{line.replace('## ', '')}</h3>;
              if (line.startsWith('# ')) return <h2 key={i} style={{ fontSize: 20, fontWeight: 800, marginBottom: 16, color: '#818cf8' }}>{line.replace('# ', '')}</h2>;
              if (line.startsWith('- ')) return <p key={i} style={{ paddingInlineStart: 16, marginBottom: 4, position: 'relative' }}><span style={{ position: 'absolute', left: isAr ? 'auto' : 0, right: isAr ? 0 : 'auto', color: '#6366f1' }}>•</span>{line.replace('- ', '')}</p>;
              if (line === '') return <div key={i} style={{ height: 8 }} />;
              return <p key={i} style={{ marginBottom: 4 }}>{line}</p>;
            })}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24, display: 'flex', gap: 20, justifyContent: 'center' }}>
          <Link to="/privacy" style={{ color: '#6366f1', textDecoration: 'none', fontSize: 13 }}>{isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}</Link>
          <Link to="/data-deletion" style={{ color: '#6366f1', textDecoration: 'none', fontSize: 13 }}>{isAr ? 'حذف البيانات' : 'Data Deletion'}</Link>
          <Link to="/" style={{ color: '#475569', textDecoration: 'none', fontSize: 13 }}>← {isAr ? 'الرئيسية' : 'Home'}</Link>
        </div>
      </div>
    </div>
  );
}
