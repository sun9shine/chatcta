import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = process.env.REACT_APP_API_URL || '/api';

const PLATFORM_INFO = {
  facebook: { label: 'Facebook', emoji: '📘', color: '#1877F2', connectType: 'token' },
  instagram: { label: 'Instagram', emoji: '📸', color: '#E1306C', connectType: 'token' },
  whatsapp: { label: 'WhatsApp', emoji: '💬', color: '#25D366', connectType: 'phoneId' },
  telegram: { label: 'Telegram', emoji: '✈️', color: '#0088CC', connectType: 'botToken' },
  tiktok: { label: 'TikTok', emoji: '🎵', color: '#FE2C55', connectType: 'openId' },
};

export default function ConnectedPages() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [pages, setPages] = useState([]);
  const [enabledPlatforms, setEnabledPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/pages`).then(r => setPages(r.data)),
      axios.get(`${API}/platforms`).then(r => setEnabledPlatforms(r.data.filter(p => p.isEnabled).map(p => p.platform))),
    ]).finally(() => setLoading(false));
  }, []);

  const handleConnect = async (platform) => {
    setConnecting(true);
    try {
      let res;
      if (platform === 'facebook') {
        res = await axios.post(`${API}/pages/facebook/connect`, form);
        setPages(prev => [...prev.filter(p => p.platform !== 'facebook'), ...res.data]);
      } else if (platform === 'instagram') {
        res = await axios.post(`${API}/pages/instagram/connect`, form);
        setPages(prev => { const f = prev.filter(p => !(p.platform === 'instagram' && p.pageId === res.data.pageId)); return [...f, res.data]; });
      } else if (platform === 'telegram') {
        res = await axios.post(`${API}/pages/telegram/connect`, form);
        setPages(prev => [...prev.filter(p => p.platform !== 'telegram' || p.pageId !== res.data.pageId), res.data]);
      } else if (platform === 'whatsapp') {
        res = await axios.post(`${API}/pages/whatsapp/connect`, form);
        setPages(prev => [...prev.filter(p => p.platform !== 'whatsapp' || p.pageId !== res.data.pageId), res.data]);
      } else if (platform === 'tiktok') {
        res = await axios.post(`${API}/pages/tiktok/connect`, form);
        setPages(prev => [...prev.filter(p => p.platform !== 'tiktok' || p.pageId !== res.data.pageId), res.data]);
      }
      toast.success(isAr ? 'تم الربط بنجاح' : 'Connected successfully');
      setModal(null); setForm({});
    } catch (err) {
      toast.error(err.response?.data?.error || (isAr ? 'فشل الاتصال' : 'Connection failed'));
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async (id) => {
    if (!window.confirm(isAr ? 'هل أنت متأكد؟' : 'Are you sure?')) return;
    try {
      await axios.delete(`${API}/pages/${id}`);
      setPages(prev => prev.filter(p => p._id !== id));
      toast.success(isAr ? 'تم قطع الاتصال' : 'Disconnected');
    } catch { toast.error(isAr ? 'حدث خطأ' : 'Error'); }
  };

  const handleToggle = async (id) => {
    try {
      const res = await axios.put(`${API}/pages/${id}/toggle`);
      setPages(prev => prev.map(p => p._id === id ? res.data : p));
    } catch { toast.error(isAr ? 'حدث خطأ' : 'Error'); }
  };

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>...</div>;

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1>{isAr ? 'الصفحات المرتبطة' : 'Connected Pages'}</h1>
          <p style={{ color: '#64748b' }}>{isAr ? 'اربط صفحاتك على وسائل التواصل الاجتماعي' : 'Connect your social media pages'}</p>
        </div>
      </div>

      {/* Platform Buttons */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 600 }}>{isAr ? 'ربط منصة جديدة' : 'Connect New Platform'}</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {enabledPlatforms.map(platform => {
            const info = PLATFORM_INFO[platform];
            if (!info) return null;
            return (
              <button key={platform} onClick={() => { setModal(platform); setForm({}); }} className="btn btn-outline" style={{ gap: 8, borderColor: info.color + '40', color: info.color }}>
                <span>{info.emoji}</span> {info.label}
              </button>
            );
          })}
          {enabledPlatforms.length === 0 && <p style={{ color: '#64748b', fontSize: 13 }}>{isAr ? 'لا توجد منصات مفعلة حالياً' : 'No platforms enabled yet'}</p>}
        </div>
      </div>

      {/* Pages List */}
      <div className="grid grid-2">
        {pages.map(page => {
          const info = PLATFORM_INFO[page.platform];
          return (
            <div key={page._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div className={`platform-icon platform-${page.platform}`} style={{ fontSize: 22 }}>{info?.emoji}</div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 15 }}>{page.pageName}</p>
                  <p style={{ fontSize: 12, color: '#64748b' }}>{info?.label} {page.pageUsername ? `• @${page.pageUsername}` : ''}</p>
                  {page.followers > 0 && <p style={{ fontSize: 12, color: '#64748b' }}>{page.followers.toLocaleString()} {isAr ? 'متابع' : 'followers'}</p>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <label className="switch">
                  <input type="checkbox" checked={page.isActive} onChange={() => handleToggle(page._id)} />
                  <span className="slider"></span>
                </label>
                <button onClick={() => handleDisconnect(page._id)} className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none' }}>✕</button>
              </div>
            </div>
          );
        })}
        {pages.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: '#64748b' }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>🔗</p>
            <p>{isAr ? 'لم تربط أي صفحة بعد' : 'No pages connected yet'}</p>
          </div>
        )}
      </div>

      {/* Connect Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">{isAr ? `ربط ${PLATFORM_INFO[modal]?.label}` : `Connect ${PLATFORM_INFO[modal]?.label}`}</h3>
            {modal === 'facebook' && (
              <div>
                <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>{isAr ? 'أدخل User Access Token من Facebook Graph Explorer' : 'Enter your User Access Token from Facebook Graph Explorer'}</p>
                <input className="input" placeholder="User Access Token" value={form.accessToken || ''} onChange={e => setForm({ ...form, accessToken: e.target.value })} style={{ marginBottom: 16 }} />
              </div>
            )}
            {modal === 'instagram' && (
              <div>
                <input className="input" placeholder="Access Token" value={form.accessToken || ''} onChange={e => setForm({ ...form, accessToken: e.target.value })} style={{ marginBottom: 12 }} />
                <input className="input" placeholder="Instagram Business Account ID" value={form.igAccountId || ''} onChange={e => setForm({ ...form, igAccountId: e.target.value })} style={{ marginBottom: 16 }} />
              </div>
            )}
            {modal === 'telegram' && (
              <div>
                <input className="input" placeholder="Bot Token (from @BotFather)" value={form.botToken || ''} onChange={e => setForm({ ...form, botToken: e.target.value })} style={{ marginBottom: 12 }} />
                <input className="input" placeholder="Chat ID (optional)" value={form.chatId || ''} onChange={e => setForm({ ...form, chatId: e.target.value })} style={{ marginBottom: 16 }} />
              </div>
            )}
            {modal === 'whatsapp' && (
              <div>
                <input className="input" placeholder="Phone Number ID" value={form.phoneNumberId || ''} onChange={e => setForm({ ...form, phoneNumberId: e.target.value })} style={{ marginBottom: 12 }} />
                <input className="input" placeholder="Access Token" value={form.accessToken || ''} onChange={e => setForm({ ...form, accessToken: e.target.value })} style={{ marginBottom: 16 }} />
              </div>
            )}
            {modal === 'tiktok' && (
              <div>
                <input className="input" placeholder="Access Token" value={form.accessToken || ''} onChange={e => setForm({ ...form, accessToken: e.target.value })} style={{ marginBottom: 12 }} />
                <input className="input" placeholder="Open ID" value={form.openId || ''} onChange={e => setForm({ ...form, openId: e.target.value })} style={{ marginBottom: 16 }} />
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(null)} className="btn btn-outline">{isAr ? 'إلغاء' : 'Cancel'}</button>
              <button onClick={() => handleConnect(modal)} className="btn btn-primary" disabled={connecting}>{connecting ? '...' : (isAr ? 'ربط' : 'Connect')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
