import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../store/authStore';

const features = [
  { icon: '🤖', key: 'autoReply', titleAr: 'رد تلقائي ذكي', titleEn: 'Smart Auto Reply', descAr: 'رد تلقائي على التعليقات والرسائل بالذكاء الاصطناعي', descEn: 'Auto reply to comments and messages with AI' },
  { icon: '📱', key: 'multiPlatform', titleAr: 'دعم متعدد المنصات', titleEn: 'Multi-Platform', descAr: 'فيسبوك، إنستغرام، واتساب، تيليجرام، تيك توك', descEn: 'Facebook, Instagram, WhatsApp, Telegram, TikTok' },
  { icon: '💬', key: 'dmAutomation', titleAr: 'أتمتة الرسائل', titleEn: 'DM Automation', descAr: 'أرسل رسائل تلقائية لكل من يعلق على منشوراتك', descEn: 'Send automatic DMs to everyone who comments on your posts' },
  { icon: '🔗', key: 'multiPage', titleAr: 'ربط عدة صفحات', titleEn: 'Multiple Pages', descAr: 'اربط وأدر عدة صفحات من لوحة تحكم واحدة', descEn: 'Connect and manage multiple pages from one dashboard' },
  { icon: '🧠', key: 'ai', titleAr: 'ذكاء اصطناعي', titleEn: 'AI Powered', descAr: 'ردود ذكية مدعومة بـ GPT تفهم سياق المحادثة', descEn: 'Smart GPT-powered responses that understand context' },
  { icon: '📊', key: 'analytics', titleAr: 'تحليلات متقدمة', titleEn: 'Analytics', descAr: 'تتبع أداء بوتاتك وحملاتك التسويقية', descEn: 'Track your bots and marketing campaign performance' },
];

const platforms = [
  { name: 'Facebook', color: '#1877F2', emoji: '📘' },
  { name: 'Instagram', color: '#E1306C', emoji: '📸' },
  { name: 'WhatsApp', color: '#25D366', emoji: '💬' },
  { name: 'Telegram', color: '#0088CC', emoji: '✈️' },
  { name: 'TikTok', color: '#FE2C55', emoji: '🎵' },
];

export default function LandingPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lang, setLang] = useState(i18n.language);
  const isAr = lang === 'ar';

  const toggleLang = () => {
    const newLang = isAr ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    setLang(newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}>
      {/* Header */}
      <header style={{ padding: '20px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>💬</div>
          <span style={{ fontSize: 22, fontWeight: 800, background: 'linear-gradient(135deg,#818cf8,#c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ChatCTA</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={toggleLang} className="btn btn-outline btn-sm">{isAr ? 'EN' : 'عربي'}</button>
          {user ? (
            <button onClick={() => navigate(user.role === 'admin' ? '/admin' : '/dashboard')} className="btn btn-primary btn-sm">
              {user.role === 'admin' ? (isAr ? 'لوحة الأدمن' : 'Admin Panel') : (isAr ? 'لوحة التحكم' : 'Dashboard')}
            </button>
          ) : (
            <>
              <button onClick={() => navigate('/login')} className="btn btn-outline btn-sm">{isAr ? 'دخول' : 'Login'}</button>
              <button onClick={() => navigate('/register')} className="btn btn-primary btn-sm">{isAr ? 'تسجيل' : 'Register'}</button>
            </>
          )}
        </div>
      </header>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '100px 20px 80px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 100, padding: '6px 18px', marginBottom: 28, fontSize: 13, color: '#818cf8' }}>
          ✨ {isAr ? 'المنصة الأكثر ذكاءً لأتمتة وسائل التواصل الاجتماعي' : 'The smartest social media automation platform'}
        </div>
        <h1 style={{ fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 900, lineHeight: 1.15, marginBottom: 24 }}>
          <span style={{ background: 'linear-gradient(135deg,#818cf8,#c084fc,#38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {isAr ? 'أتمتة كاملة' : 'Complete Automation'}
          </span>
          <br />
          <span style={{ color: '#f1f5f9' }}>
            {isAr ? 'لوسائل التواصل الاجتماعي' : 'for Social Media'}
          </span>
        </h1>
        <p style={{ fontSize: 18, color: '#94a3b8', maxWidth: 600, margin: '0 auto 44px', lineHeight: 1.7 }}>
          {isAr
            ? 'ارد تلقائياً على التعليقات والرسائل، أنشئ بوتات ذكية، ووفر وقتك مع أقوى منصة أتمتة باللغة العربية'
            : 'Auto-reply to comments and messages, create smart bots, and save time with the most powerful automation platform'}
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/register')} className="btn btn-primary btn-lg" style={{ fontSize: 18, padding: '16px 40px', boxShadow: '0 8px 30px rgba(99,102,241,0.5)' }}>
            🚀 {isAr ? 'ابدأ مجاناً' : 'Start Free'}
          </button>
          <button onClick={() => navigate('/login')} className="btn btn-outline btn-lg">
            {isAr ? 'تسجيل الدخول' : 'Sign In'}
          </button>
        </div>
      </section>

      {/* Platforms */}
      <section style={{ padding: '40px 20px', textAlign: 'center' }}>
        <p style={{ color: '#64748b', fontSize: 13, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 24 }}>
          {isAr ? 'يتكامل مع' : 'Integrates with'}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
          {platforms.map(p => (
            <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 20px', fontSize: 14, fontWeight: 600 }}>
              <span style={{ fontSize: 22 }}>{p.emoji}</span>
              <span style={{ color: p.color }}>{p.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 20px', maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: 36, fontWeight: 800, marginBottom: 16 }}>
          {isAr ? 'كل ما تحتاجه في مكان واحد' : 'Everything you need in one place'}
        </h2>
        <p style={{ textAlign: 'center', color: '#94a3b8', marginBottom: 60, fontSize: 16 }}>
          {isAr ? 'أدوات متكاملة لأتمتة تسويقك الرقمي' : 'Integrated tools to automate your digital marketing'}
        </p>
        <div className="grid grid-3">
          {features.map(f => (
            <div key={f.key} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '32px 28px', transition: 'all 0.3s', cursor: 'default' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>{f.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{isAr ? f.titleAr : f.titleEn}</h3>
              <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.7 }}>{isAr ? f.descAr : f.descEn}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 20px', textAlign: 'center' }}>
        <div style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.15))', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 24, padding: '60px 40px', maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16 }}>
            {isAr ? 'جاهز للبدء؟' : 'Ready to get started?'}
          </h2>
          <p style={{ color: '#94a3b8', marginBottom: 32, fontSize: 16 }}>
            {isAr ? 'انضم إلى آلاف المستخدمين الذين يوفرون وقتهم مع ChatCTA' : 'Join thousands of users saving time with ChatCTA'}
          </p>
          <button onClick={() => navigate('/register')} className="btn btn-primary btn-lg" style={{ fontSize: 18, boxShadow: '0 8px 30px rgba(99,102,241,0.5)' }}>
            {isAr ? '🚀 ابدأ الآن مجاناً' : '🚀 Start Free Now'}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '40px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', color: '#475569', fontSize: 13 }}>
        <p>© 2024 ChatCTA. {isAr ? 'جميع الحقوق محفوظة' : 'All rights reserved'}.</p>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 12 }}>
          <a href="/privacy" style={{ color: '#6366f1', textDecoration: 'none' }}>{isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}</a>
          <a href="/terms" style={{ color: '#6366f1', textDecoration: 'none' }}>{isAr ? 'شروط الخدمة' : 'Terms of Service'}</a>
          <a href="/data-deletion" style={{ color: '#6366f1', textDecoration: 'none' }}>{isAr ? 'حذف البيانات' : 'Data Deletion'}</a>
        </div>
      </footer>
    </div>
  );
}
