import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = process.env.REACT_APP_API_URL || '/api';

const PLATFORM_INFO = {
  facebook:  { label: 'Facebook',  emoji: '📘', color: '#1877F2' },
  instagram: { label: 'Instagram', emoji: '📸', color: '#E1306C' },
  whatsapp:  { label: 'WhatsApp',  emoji: '💬', color: '#25D366' },
  telegram:  { label: 'Telegram',  emoji: '✈️', color: '#0088CC' },
  tiktok:    { label: 'TikTok',    emoji: '🎵', color: '#FE2C55' },
};

export default function ConnectedPages() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [pages, setPages] = useState([]);
  const [enabledPlatforms, setEnabledPlatforms] = useState([]);
  const [fbAppId, setFbAppId] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [connecting, setConnecting] = useState(false);
  const [fbReady, setFbReady] = useState(false);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/pages`).then(r => setPages(r.data)),
      axios.get(`${API}/platforms`).then(r => {
        const enabled = r.data.filter(p => p.isEnabled);
        setEnabledPlatforms(enabled.map(p => p.platform));
        const fb = enabled.find(p => p.platform === 'facebook');
        if (fb && fb.appId) setFbAppId(fb.appId);
      }),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!fbAppId || fbReady) return;
    if (window.FB) { setFbReady(true); return; }
    window.fbAsyncInit = function() {
      window.FB.init({ appId: fbAppId, cookie: true, xfbml: false, version: 'v18.0' });
      setFbReady(true);
    };
    if (!document.getElementById('facebook-jssdk')) {
      const s = document.createElement('script');
      s.id = 'facebook-jssdk'; s.async = true; s.defer = true;
      s.src = 'https://connect.facebook.net/en_US/sdk.js';
      document.body.appendChild(s);
    }
  }, [fbAppId, fbReady]);

  const connectFacebookOAuth = useCallback(() => {
    if (!window.FB) return false;
    setConnecting(true);
    window.FB.login(function(response) {
      if (response.authResponse) {
        axios.post(`${API}/pages/facebook/connect`, { accessToken: response.authResponse.accessToken })
          .then(r => { setPages(prev => [...prev.filter(p => p.platform !== 'facebook'), ...r.data]); toast.success(isAr ? 'تم ربط الصفحات' : 'Pages connected'); setModal(null); })
          .catch(err => toast.error(err.response?.data?.error || 'Error'))
          .finally(() => setConnecting(false));
      } else { setConnecting(false); }
    }, { scope: 'pages_show_list,pages_messaging,pages_manage_posts,pages_read_engagement,instagram_basic,instagram_manage_messages,instagram_manage_comments' });
    return true;
  }, [isAr]);

  const connectInstagramOAuth = useCallback(() => {
    if (!window.FB) return false;
    setConnecting(true);
    window.FB.login(function(response) {
      if (response.authResponse) {
        const token = response.authResponse.accessToken;
        axios.get(`https://graph.facebook.com/v18.0/me/accounts?access_token=${token}&fields=id,name,instagram_business_account`)
          .then(async (resp) => {
            const igPages = (resp.data.data || []).filter(p => p.instagram_business_account);
            if (igPages.length === 0) { toast.error(isAr ? 'لا توجد حسابات إنستغرام' : 'No Instagram accounts found'); return; }
            for (const page of igPages) {
              try {
                const r = await axios.post(`${API}/pages/instagram/connect`, { accessToken: token, igAccountId: page.instagram_business_account.id });
                setPages(prev => [...prev.filter(p => !(p.platform === 'instagram' && p.pageId === r.data.pageId)), r.data]);
              } catch (e) {}
            }
            toast.success(isAr ? 'تم ربط إنستغرام' : 'Instagram connected'); setModal(null);
          })
          .catch(() => toast.error('Error'))
          .finally(() => setConnecting(false));
      } else { setConnecting(false); }
    }, { scope: 'pages_show_list,instagram_basic,instagram_manage_messages,instagram_manage_comments' });
    return true;
  }, [isAr]);

  const handlePlatformClick = (platform) => {
    if (platform === 'facebook' && fbReady) { connectFacebookOAuth(); }
    else if (platform === 'instagram' && fbReady) { connectInstagramOAuth(); }
    else { setModal(platform); setForm({}); }
  };

  const handleManualConnect = async () => {
    setConnecting(true);
    try {
      let res;
      if (modal === 'facebook') { res = await axios.post(`${API}/pages/facebook/connect`, { accessToken: form.accessToken }); setPages(prev => [...prev.filter(p => p.platform !== 'facebook'), ...(Array.isArray(res.data) ? res.data : [res.data])]); }
      else if (modal === 'instagram') { res = await axios.post(`${API}/pages/instagram/connect`, form); setPages(prev => [...prev.filter(p => !(p.platform === 'instagram' && p.pageId === res.data.pageId)), res.data]); }
      else if (modal === 'telegram') { res = await axios.post(`${API}/pages/telegram/connect`, form); setPages(prev => [...prev.filter(p => !(p.platform === 'telegram' && p.pageId === res.data.pageId)), res.data]); }
      else if (modal === 'whatsapp') { res = await axios.post(`${API}/pages/whatsapp/connect`, form); setPages(prev => [...prev.filter(p => !(p.platform === 'whatsapp' && p.pageId === res.data.pageId)), res.data]); }
      else if (modal === 'tiktok') { res = await axios.post(`${API}/pages/tiktok/connect`, form); setPages(prev => [...prev.filter(p => !(p.platform === 'tiktok' && p.pageId === res.data.pageId)), res.data]); }
      toast.success(isAr ? 'تم الربط' : 'Connected'); setModal(null); setForm({});
    } catch (err) { toast.error(err.response?.data?.error || (isAr ? 'فشل' : 'Failed')); }
    finally { setConnecting(false); }
  };

  const handleDisconnect = async (id) => {
    if (!window.confirm(isAr ? 'قطع الاتصال؟' : 'Disconnect?')) return;
    await axios.delete(`${API}/pages/${id}`).catch(() => {});
    setPages(prev => prev.filter(p => p._id !== id));
  };

  const handleToggle = async (id) => {
    const res = await axios.put(`${API}/pages/${id}/toggle`);
    setPages(prev => prev.map(p => p._id === id ? res.data : p));
  };

  if (loading) return <div style={{ padding:60, textAlign:'center', color:'#64748b' }}>...</div>;

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1>{isAr ? '🔗 الصفحات المرتبطة' : '🔗 Connected Pages'}</h1>
          <p style={{ color:'#64748b' }}>{isAr ? 'اربط حساباتك واختر الصفحات' : 'Connect accounts and choose pages'}</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom:24 }}>
        <h3 style={{ marginBottom:12, fontSize:15, fontWeight:600 }}>{isAr ? 'ربط منصة جديدة' : 'Connect New Platform'}</h3>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
          {enabledPlatforms.map(platform => {
            const info = PLATFORM_INFO[platform]; if (!info) return null;
            const useOAuth = (platform === 'facebook' || platform === 'instagram') && fbReady;
            return (
              <button key={platform} onClick={() => handlePlatformClick(platform)} disabled={connecting}
                className="btn" style={{ gap:8, padding:'12px 20px', background: useOAuth ? info.color : 'transparent', color: useOAuth ? '#fff' : info.color, border: useOAuth ? 'none' : `1px solid ${info.color}40`, borderRadius:12 }}>
                <span style={{ fontSize:18 }}>{info.emoji}</span>
                <span style={{ fontWeight:600 }}>{useOAuth ? (isAr ? `دخول بـ ${info.label}` : `Login with ${info.label}`) : (isAr ? `ربط ${info.label}` : `Connect ${info.label}`)}</span>
              </button>
            );
          })}
          {enabledPlatforms.length === 0 && <p style={{ color:'#64748b', fontSize:13 }}>{isAr ? 'لا توجد منصات مفعلة' : 'No platforms enabled'}</p>}
        </div>
        {(enabledPlatforms.includes('facebook') || enabledPlatforms.includes('instagram')) && !fbReady && (
          <p style={{ fontSize:11, color:'#f59e0b', marginTop:10 }}>{isAr ? '⚠️ OAuth غير متاح (App ID غير مُعد). يمكنك إدخال Token يدوياً.' : '⚠️ OAuth not available. You can enter token manually.'}</p>
        )}
      </div>

      <div className="grid grid-2">
        {pages.map(page => {
          const info = PLATFORM_INFO[page.platform];
          return (
            <div key={page._id} className="card" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                <div className={`platform-icon platform-${page.platform}`} style={{ fontSize:22 }}>{info?.emoji}</div>
                <div>
                  <p style={{ fontWeight:600, fontSize:15 }}>{page.pageName}</p>
                  <p style={{ fontSize:12, color:'#64748b' }}>{info?.label} {page.pageUsername ? `@${page.pageUsername}` : ''}</p>
                  {page.followers > 0 && <p style={{ fontSize:12, color:'#64748b' }}>{page.followers.toLocaleString()} {isAr ? 'متابع' : 'followers'}</p>}
                </div>
              </div>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <label className="switch"><input type="checkbox" checked={page.isActive} onChange={() => handleToggle(page._id)} /><span className="slider"></span></label>
                <button onClick={() => handleDisconnect(page._id)} className="btn btn-sm" style={{ background:'rgba(239,68,68,0.1)', color:'#ef4444', border:'none' }}>✕</button>
              </div>
            </div>
          );
        })}
        {pages.length === 0 && <div style={{ gridColumn:'1/-1', textAlign:'center', padding:60, color:'#64748b' }}><p style={{ fontSize:40, marginBottom:12 }}>🔗</p><p>{isAr ? 'لم تربط أي صفحة بعد' : 'No pages connected yet'}</p></div>}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">{PLATFORM_INFO[modal]?.emoji} {isAr ? `ربط ${PLATFORM_INFO[modal]?.label}` : `Connect ${PLATFORM_INFO[modal]?.label}`}</h3>
            {modal === 'facebook' && (<div>
              <p style={{ fontSize:13, color:'#64748b', marginBottom:14 }}>{isAr ? 'أدخل Page Access Token' : 'Enter Page Access Token'}</p>
              <input className="input" placeholder="Access Token" value={form.accessToken || ''} onChange={e => setForm({...form, accessToken: e.target.value})} style={{ marginBottom:16 }} />
              {fbAppId && <button onClick={() => { setModal(null); connectFacebookOAuth(); }} className="btn" style={{ width:'100%', marginBottom:12, justifyContent:'center', background:'#1877F2', color:'#fff', border:'none', borderRadius:10 }}>{isAr ? '🔐 تسجيل دخول بفيسبوك' : '🔐 Login with Facebook'}</button>}
            </div>)}
            {modal === 'instagram' && (<div>
              <input className="input" placeholder="Access Token" value={form.accessToken || ''} onChange={e => setForm({...form, accessToken: e.target.value})} style={{ marginBottom:12 }} />
              <input className="input" placeholder="Instagram Business Account ID" value={form.igAccountId || ''} onChange={e => setForm({...form, igAccountId: e.target.value})} style={{ marginBottom:16 }} />
              {fbAppId && <button onClick={() => { setModal(null); connectInstagramOAuth(); }} className="btn" style={{ width:'100%', marginBottom:12, justifyContent:'center', background:'#E1306C', color:'#fff', border:'none', borderRadius:10 }}>{isAr ? '🔐 دخول بفيسبوك/إنستغرام' : '🔐 Login with Facebook/Instagram'}</button>}
            </div>)}
            {modal === 'telegram' && (<div>
              <p style={{ fontSize:13, color:'#64748b', marginBottom:14 }}>{isAr ? 'أنشئ بوت من @BotFather' : 'Create bot via @BotFather'}</p>
              <input className="input" placeholder="Bot Token" value={form.botToken || ''} onChange={e => setForm({...form, botToken: e.target.value})} style={{ marginBottom:12 }} />
              <input className="input" placeholder={isAr ? 'Chat ID (اختياري)' : 'Chat ID (optional)'} value={form.chatId || ''} onChange={e => setForm({...form, chatId: e.target.value})} style={{ marginBottom:16 }} />
            </div>)}
            {modal === 'whatsapp' && (<div>
              <input className="input" placeholder="Phone Number ID" value={form.phoneNumberId || ''} onChange={e => setForm({...form, phoneNumberId: e.target.value})} style={{ marginBottom:12 }} />
              <input className="input" placeholder="Access Token" value={form.accessToken || ''} onChange={e => setForm({...form, accessToken: e.target.value})} style={{ marginBottom:16 }} />
            </div>)}
            {modal === 'tiktok' && (<div>
              <input className="input" placeholder="Access Token" value={form.accessToken || ''} onChange={e => setForm({...form, accessToken: e.target.value})} style={{ marginBottom:12 }} />
              <input className="input" placeholder="Open ID" value={form.openId || ''} onChange={e => setForm({...form, openId: e.target.value})} style={{ marginBottom:16 }} />
            </div>)}
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => setModal(null)} className="btn btn-outline">{isAr ? 'إلغاء' : 'Cancel'}</button>
              <button onClick={handleManualConnect} className="btn btn-primary" disabled={connecting}>{connecting ? '⏳' : (isAr ? '🔗 ربط' : '🔗 Connect')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
