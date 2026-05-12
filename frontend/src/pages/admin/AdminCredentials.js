import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../store/authStore';

const API = process.env.REACT_APP_API_URL || '/api';

export default function AdminCredentials() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ email: user?.email || '', password: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (form.password && form.password !== form.confirmPassword) {
      return toast.error(isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
    }
    setSaving(true);
    try {
      const payload = {};
      if (form.email !== user?.email) payload.email = form.email;
      if (form.password) payload.password = form.password;
      if (!Object.keys(payload).length) return toast(isAr ? 'لم تتغير أي بيانات' : 'Nothing to update');
      await axios.put(`${API}/admin/credentials`, payload);
      if (payload.email) updateUser({ email: payload.email });
      toast.success(isAr ? 'تم تحديث بيانات الأدمن' : 'Admin credentials updated');
      setForm(prev => ({ ...prev, password: '', confirmPassword: '' }));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <div className="page-header">
        <h1>⚙️ {isAr ? 'بيانات الأدمن' : 'Admin Credentials'}</h1>
        <p style={{ color: '#64748b' }}>{isAr ? 'تغيير بريد الأدمن وكلمة المرور' : 'Change admin email and password'}</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, padding: '16px 0', borderBottom: '1px solid #334155' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🛡️</div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 16 }}>{user?.name}</p>
            <p style={{ fontSize: 13, color: '#64748b' }}>{user?.email}</p>
            <span className="badge badge-primary" style={{ marginTop: 4 }}>Admin</span>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#94a3b8' }}>{isAr ? 'البريد الإلكتروني' : 'Email Address'}</label>
            <input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#94a3b8' }}>{isAr ? 'كلمة المرور الجديدة' : 'New Password'} <span style={{ color: '#475569' }}>({isAr ? 'اتركها فارغة لعدم التغيير' : 'leave empty to keep current'})</span></label>
            <input className="input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>
          {form.password && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#94a3b8' }}>{isAr ? 'تأكيد كلمة المرور' : 'Confirm Password'}</label>
              <input className="input" type="password" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required />
            </div>
          )}
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '...' : (isAr ? '💾 حفظ التغييرات' : '💾 Save Changes')}</button>
        </form>
      </div>

      <div className="card" style={{ marginTop: 20, background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)' }}>
        <h3 style={{ marginBottom: 8, fontSize: 14, fontWeight: 600 }}>🔐 {isAr ? 'معلومات الأمان' : 'Security Info'}</h3>
        <ul style={{ fontSize: 13, color: '#64748b', paddingInlineStart: 20, lineHeight: 2 }}>
          <li>{isAr ? 'تأكد من استخدام كلمة مرور قوية تحتوي على أحرف وأرقام ورموز' : 'Use a strong password with letters, numbers, and symbols'}</li>
          <li>{isAr ? 'احتفظ ببيانات تسجيل الدخول في مكان آمن' : 'Keep your login credentials in a secure place'}</li>
          <li>{isAr ? 'قم بتغيير كلمة المرور دورياً' : 'Change your password periodically'}</li>
        </ul>
      </div>
    </div>
  );
}
