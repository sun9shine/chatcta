import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = process.env.REACT_APP_API_URL || '/api';

export default function DataDeletion() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error(isAr ? 'أدخل بريدك الإلكتروني' : 'Enter your email');
    setLoading(true);
    try {
      // This sends a support message to admin requesting deletion
      await axios.post(`${API}/auth/request-deletion`, { email, reason }).catch(() => {});
      setSubmitted(true);
    } catch (err) {
      setSubmitted(true); // Show success anyway (privacy: don't reveal if email exists)
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', padding: '40px 20px' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>💬</div>
            <span style={{ fontWeight: 800, fontSize: 18, background: 'linear-gradient(135deg,#818cf8,#c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ChatCTA</span>
          </Link>
          <button onClick={() => { const n = isAr ? 'en' : 'ar'; i18n.changeLanguage(n); document.documentElement.dir = n === 'ar' ? 'rtl' : 'ltr'; }} className="btn btn-outline btn-sm">{isAr ? 'EN' : 'عربي'}</button>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid #334155' }}>
            <span style={{ fontSize: 32 }}>🗑️</span>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800 }}>{isAr ? 'طلب حذف البيانات' : 'Data Deletion Request'}</h1>
              <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{isAr ? 'حذف حسابك وجميع بياناتك من منصتنا' : 'Delete your account and all data from our platform'}</p>
            </div>
          </div>

          {submitted ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ fontSize: 48, marginBottom: 16 }}>✅</p>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>{isAr ? 'تم استلام طلبك' : 'Request Received'}</h2>
              <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.8, maxWidth: 450, margin: '0 auto' }}>
                {isAr
                  ? 'سيتم معالجة طلب حذف بياناتك خلال 30 يوماً كحد أقصى. ستتلقى إشعاراً على بريدك الإلكتروني عند اكتمال العملية.'
                  : 'Your data deletion request will be processed within 30 days. You will receive an email notification when complete.'}
              </p>
              <p style={{ fontSize: 13, color: '#475569', marginTop: 16 }}>
                {isAr ? 'ما سيتم حذفه:' : 'What will be deleted:'}
              </p>
              <ul style={{ fontSize: 13, color: '#64748b', textAlign: 'start', maxWidth: 350, margin: '10px auto', lineHeight: 2 }}>
                <li>{isAr ? 'معلومات حسابك (الاسم، البريد، الهاتف)' : 'Account info (name, email, phone)'}</li>
                <li>{isAr ? 'جميع الصفحات المرتبطة' : 'All connected pages'}</li>
                <li>{isAr ? 'جميع البوتات والإعدادات' : 'All bots and settings'}</li>
                <li>{isAr ? 'سجل الرسائل والتعليقات' : 'Message and comment history'}</li>
                <li>{isAr ? 'بيانات الاشتراك' : 'Subscription data'}</li>
              </ul>
              <Link to="/" className="btn btn-outline" style={{ marginTop: 24 }}>
                {isAr ? '← العودة للرئيسية' : '← Back to Home'}
              </Link>
            </div>
          ) : (
            <div>
              <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '14px 18px', marginBottom: 24, fontSize: 13, color: '#f59e0b', lineHeight: 1.8 }}>
                ⚠️ {isAr
                  ? 'هذا الإجراء لا يمكن التراجع عنه. سيتم حذف جميع بياناتك بشكل دائم بما في ذلك الصفحات المرتبطة والبوتات وسجل الرسائل.'
                  : 'This action is irreversible. All your data will be permanently deleted including connected pages, bots, and message history.'}
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#94a3b8' }}>
                    {isAr ? 'البريد الإلكتروني المسجّل' : 'Registered Email Address'}
                  </label>
                  <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={isAr ? 'your@email.com' : 'your@email.com'} required />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#94a3b8' }}>
                    {isAr ? 'سبب الحذف (اختياري)' : 'Reason for deletion (optional)'}
                  </label>
                  <textarea className="input" rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder={isAr ? 'أخبرنا لماذا تريد حذف حسابك...' : 'Tell us why you want to delete your account...'} />
                </div>
                <button type="submit" className="btn btn-danger" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                  {loading ? '⏳' : '🗑️'} {isAr ? 'إرسال طلب الحذف' : 'Submit Deletion Request'}
                </button>
              </form>

              <p style={{ fontSize: 12, color: '#475569', marginTop: 20, textAlign: 'center', lineHeight: 1.8 }}>
                {isAr
                  ? 'بعد إرسال الطلب، سيتم مراجعته ومعالجته خلال 30 يوماً وفقاً لسياسة الخصوصية الخاصة بنا وسياسات Meta و Google و TikTok.'
                  : 'After submission, your request will be reviewed and processed within 30 days per our Privacy Policy and Meta/Google/TikTok platform policies.'}
              </p>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 24, display: 'flex', gap: 20, justifyContent: 'center' }}>
          <Link to="/privacy" style={{ color: '#6366f1', textDecoration: 'none', fontSize: 13 }}>{isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}</Link>
          <Link to="/terms" style={{ color: '#6366f1', textDecoration: 'none', fontSize: 13 }}>{isAr ? 'شروط الخدمة' : 'Terms of Service'}</Link>
          <Link to="/" style={{ color: '#475569', textDecoration: 'none', fontSize: 13 }}>← {isAr ? 'الرئيسية' : 'Home'}</Link>
        </div>
      </div>
    </div>
  );
}
