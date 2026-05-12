import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || '/api';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error(isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
    setLoading(true);
    try {
      await axios.post(`${API}/auth/reset-password/${token}`, { password: form.password });
      toast.success(isAr ? 'تم تغيير كلمة المرور' : 'Password changed successfully');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || (isAr ? 'رابط منتهي الصلاحية' : 'Invalid or expired link'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0f172a,#1e1b4b)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div className="card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, textAlign: 'center' }}>{isAr ? 'تعيين كلمة مرور جديدة' : 'Set New Password'}</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#94a3b8' }}>{isAr ? 'كلمة المرور الجديدة' : 'New Password'}</label>
              <input className="input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#94a3b8' }}>{isAr ? 'تأكيد كلمة المرور' : 'Confirm Password'}</label>
              <input className="input" type="password" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
              {loading ? '...' : (isAr ? 'حفظ كلمة المرور' : 'Save Password')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
