import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = process.env.REACT_APP_API_URL || '/api';

export default function AdminSmtp() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [form, setForm] = useState({ host: '', port: 587, secure: false, user: '', password: '', fromName: 'ChatCTA', fromEmail: '' });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    axios.get(`${API}/smtp`).then(r => { if (r.data) setForm({ ...form, ...r.data, password: '' }); }).catch(() => {});
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(`${API}/smtp`, form);
      toast.success(isAr ? 'تم الحفظ' : 'Saved');
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
    finally { setSaving(false); }
  };

  const handleTest = async () => {
    setTesting(true); setStatus(null);
    try {
      await axios.post(`${API}/smtp/test`);
      setStatus('success');
      toast.success(isAr ? 'اتصال SMTP ناجح!' : 'SMTP connection successful!');
    } catch (err) {
      setStatus('failed');
      toast.error(err.response?.data?.error || (isAr ? 'فشل الاتصال' : 'Connection failed'));
    } finally { setTesting(false); }
  };

  const F = ({ label, children }) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#94a3b8' }}>{label}</label>
      {children}
    </div>
  );

  return (
    <div style={{ maxWidth: 700 }}>
      <div className="page-header">
        <h1>📧 {isAr ? 'إعدادات البريد الإلكتروني (SMTP)' : 'Email Settings (SMTP)'}</h1>
        <p style={{ color: '#64748b' }}>{isAr ? 'إعداد خادم البريد لاسترداد كلمات المرور والإشعارات' : 'Configure email server for password recovery and notifications'}</p>
      </div>

      <div className="card">
        <form onSubmit={handleSave}>
          <div className="grid grid-2">
            <F label="SMTP Host">
              <input className="input" value={form.host} onChange={e => setForm({ ...form, host: e.target.value })} placeholder="smtp.gmail.com" required />
            </F>
            <F label="SMTP Port">
              <input className="input" type="number" value={form.port} onChange={e => setForm({ ...form, port: Number(e.target.value) })} />
            </F>
          </div>
          <div className="grid grid-2">
            <F label={isAr ? 'البريد الإلكتروني' : 'Email Username'}>
              <input className="input" type="email" value={form.user} onChange={e => setForm({ ...form, user: e.target.value })} placeholder="you@gmail.com" required />
            </F>
            <F label={isAr ? 'كلمة مرور البريد' : 'Email Password'}>
              <input className="input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder={isAr ? 'اتركها فارغة إذا لم تتغير' : 'Leave empty if unchanged'} />
            </F>
          </div>
          <div className="grid grid-2">
            <F label={isAr ? 'اسم المرسل' : 'From Name'}>
              <input className="input" value={form.fromName} onChange={e => setForm({ ...form, fromName: e.target.value })} />
            </F>
            <F label={isAr ? 'بريد المرسل' : 'From Email'}>
              <input className="input" type="email" value={form.fromEmail} onChange={e => setForm({ ...form, fromEmail: e.target.value })} />
            </F>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <label className="switch">
              <input type="checkbox" checked={form.secure} onChange={e => setForm({ ...form, secure: e.target.checked })} />
              <span className="slider"></span>
            </label>
            <span style={{ fontSize: 13 }}>SSL/TLS {isAr ? '(للمنفذ 465)' : '(for port 465)'}</span>
          </div>

          {status && (
            <div style={{ padding: '10px 16px', borderRadius: 10, marginBottom: 16, background: status === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: status === 'success' ? '#10b981' : '#ef4444', fontSize: 13 }}>
              {status === 'success' ? '✓ ' + (isAr ? 'الاتصال ناجح' : 'Connection successful') : '✕ ' + (isAr ? 'فشل الاتصال' : 'Connection failed')}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '...' : (isAr ? '💾 حفظ الإعدادات' : '💾 Save Settings')}</button>
            <button type="button" onClick={handleTest} className="btn btn-outline" disabled={testing}>{testing ? '...' : (isAr ? '🔌 اختبار الاتصال' : '🔌 Test Connection')}</button>
          </div>
        </form>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ marginBottom: 12, fontSize: 15, fontWeight: 600 }}>💡 {isAr ? 'إعدادات مزودين البريد' : 'Email Provider Settings'}</h3>
        <div style={{ fontSize: 13, color: '#64748b', lineHeight: 2 }}>
          <p><strong>Gmail:</strong> Host: smtp.gmail.com | Port: 587 | {isAr ? 'تحتاج App Password' : 'Requires App Password'}</p>
          <p><strong>Outlook:</strong> Host: smtp.office365.com | Port: 587</p>
          <p><strong>Yahoo:</strong> Host: smtp.mail.yahoo.com | Port: 465 | SSL: on</p>
          <p><strong>SendGrid:</strong> Host: smtp.sendgrid.net | Port: 587 | User: apikey</p>
        </div>
      </div>
    </div>
  );
}
