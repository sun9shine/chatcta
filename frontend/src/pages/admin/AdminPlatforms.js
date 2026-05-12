import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = process.env.REACT_APP_API_URL || '/api';

const PLATFORMS = [
  { id: 'facebook', label: 'Facebook', emoji: '📘', color: '#1877F2', fields: [
    { key: 'appId', label: 'App ID' },
    { key: 'appSecret', label: 'App Secret', type: 'password' },
    { key: 'accessToken', label: 'Page Access Token', type: 'password' },
    { key: 'verifyToken', label: 'Webhook Verify Token' },
  ]},
  { id: 'instagram', label: 'Instagram', emoji: '📸', color: '#E1306C', fields: [
    { key: 'appId', label: 'App ID' },
    { key: 'appSecret', label: 'App Secret', type: 'password' },
    { key: 'verifyToken', label: 'Webhook Verify Token' },
  ]},
  { id: 'whatsapp', label: 'WhatsApp', emoji: '💬', color: '#25D366', fields: [
    { key: 'appId', label: 'App ID' },
    { key: 'appSecret', label: 'App Secret', type: 'password' },
    { key: 'accessToken', label: 'Business Access Token', type: 'password' },
    { key: 'phoneNumberId', label: 'Phone Number ID' },
    { key: 'businessAccountId', label: 'Business Account ID' },
    { key: 'verifyToken', label: 'Webhook Verify Token' },
  ]},
  { id: 'telegram', label: 'Telegram', emoji: '✈️', color: '#0088CC', fields: [
    { key: 'botToken', label: 'Bot Token', type: 'password' },
  ]},
  { id: 'tiktok', label: 'TikTok', emoji: '🎵', color: '#FE2C55', fields: [
    { key: 'clientKey', label: 'Client Key' },
    { key: 'clientSecret', label: 'Client Secret', type: 'password' },
    { key: 'verifyToken', label: 'Webhook Verify Token' },
  ]},
];

export default function AdminPlatforms() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [configs, setConfigs] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [saving, setSaving] = useState(null);
  const [forms, setForms] = useState({});

  useEffect(() => {
    axios.get(`${API}/platforms/admin`).then(r => {
      const c = {}; const f = {};
      r.data.forEach(p => { c[p.platform] = p; f[p.platform] = { ...p }; });
      setConfigs(c); setForms(f);
    });
  }, []);

  const handleToggle = async (platform) => {
    try {
      const res = await axios.put(`${API}/platforms/${platform}/toggle`);
      setConfigs(prev => ({ ...prev, [platform]: res.data }));
      toast.success(isAr ? (res.data.isEnabled ? 'تم تفعيل المنصة' : 'تم تعطيل المنصة') : (res.data.isEnabled ? 'Platform enabled' : 'Platform disabled'));
    } catch { toast.error('Error'); }
  };

  const handleSave = async (platform) => {
    setSaving(platform);
    try {
      const res = await axios.put(`${API}/platforms/${platform}`, forms[platform]);
      setConfigs(prev => ({ ...prev, [platform]: res.data }));
      toast.success(isAr ? 'تم الحفظ' : 'Saved');
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
    finally { setSaving(null); }
  };

  const BASE_URL = window.location.origin;

  return (
    <div>
      <div className="page-header">
        <h1>{isAr ? 'إدارة المنصات' : 'Platform Management'}</h1>
        <p style={{ color: '#64748b' }}>{isAr ? 'تفعيل وإعداد مفاتيح API لكل منصة' : 'Enable and configure API keys for each platform'}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {PLATFORMS.map(p => {
          const config = configs[p.id] || {};
          const form = forms[p.id] || {};
          const isOpen = expanded === p.id;

          return (
            <div key={p.id} className="card">
              <div className="flex-between">
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div className={`platform-icon platform-${p.id}`} style={{ fontSize: 24 }}>{p.emoji}</div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 16 }}>{p.label}</p>
                    <p style={{ fontSize: 12, color: '#64748b' }}>
                      {isAr ? 'رابط الويبهوك: ' : 'Webhook URL: '}
                      <code style={{ fontSize: 11, color: '#818cf8' }}>{BASE_URL}/webhook/{p.id}</code>
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span className={`badge ${config.isEnabled ? 'badge-success' : 'badge-danger'}`}>
                    {config.isEnabled ? (isAr ? 'مفعل' : 'Enabled') : (isAr ? 'معطل' : 'Disabled')}
                  </span>
                  <label className="switch">
                    <input type="checkbox" checked={!!config.isEnabled} onChange={() => handleToggle(p.id)} />
                    <span className="slider"></span>
                  </label>
                  <button onClick={() => setExpanded(isOpen ? null : p.id)} className="btn btn-sm btn-outline">
                    {isOpen ? '▲' : '⚙️ ' + (isAr ? 'إعداد' : 'Config')}
                  </button>
                </div>
              </div>

              {isOpen && (
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #334155' }}>
                  <div className="grid grid-2" style={{ marginBottom: 16 }}>
                    {p.fields.map(field => (
                      <div key={field.key}>
                        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#94a3b8' }}>{field.label}</label>
                        <input
                          className="input" type={field.type || 'text'}
                          value={form[field.key] || ''}
                          onChange={e => setForms(prev => ({ ...prev, [p.id]: { ...prev[p.id], [field.key]: e.target.value } }))}
                          placeholder={field.label}
                        />
                      </div>
                    ))}
                  </div>
                  <button onClick={() => handleSave(p.id)} className="btn btn-primary btn-sm" disabled={saving === p.id}>
                    {saving === p.id ? '...' : (isAr ? '💾 حفظ الإعدادات' : '💾 Save Settings')}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
