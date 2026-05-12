import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || '/api';

export default function ForgotPassword() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/auth/forgot-password`, { email });
      setSent(true);
      toast.success(isAr ? 'تم إرسال رابط الاسترداد' : 'Reset link sent');
    } catch {
      toast.error(isAr ? 'حدث خطأ' : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0f172a,#1e1b4b)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔑</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>{isAr ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}</h2>
          {sent ? (
            <p style={{ color: '#10b981', marginBottom: 20 }}>{isAr ? 'تم إرسال رابط استرداد كلمة المرور إلى بريدك الإلكتروني.' : 'Password reset link sent to your email.'}</p>
          ) : (
            <>
              <p style={{ color: '#94a3b8', marginBottom: 24, fontSize: 14 }}>
                {isAr ? 'أدخل بريدك الإلكتروني وسنرسل لك رابط لاسترداد حسابك' : 'Enter your email and we\'ll send you a reset link'}
              </p>
              <form onSubmit={handleSubmit}>
                <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={isAr ? 'بريدك الإلكتروني' : 'Your email'} required style={{ marginBottom: 16 }} />
                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                  {loading ? '...' : (isAr ? 'إرسال الرابط' : 'Send Reset Link')}
                </button>
              </form>
            </>
          )}
          <div style={{ marginTop: 20 }}>
            <Link to="/login" style={{ color: '#6366f1', textDecoration: 'none', fontSize: 13 }}>← {isAr ? 'العودة لتسجيل الدخول' : 'Back to Login'}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
