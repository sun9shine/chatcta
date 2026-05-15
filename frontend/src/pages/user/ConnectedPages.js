import React, { useEffect, useState } from 'react';
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
  const [platformConfigs, setPlatformConfigs] = useState({});
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [connecting, setConnecting] = useState(false);
  const [fbLoaded, setFbLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/pages`).then(r => setPages(r.data)),
      axios.get(`${API}/platforms`).then(r => {
        const enabled = r.data.filter(p => p.isEnabled);
        setEnabledPlatforms(enabled.map(p => p.platform));
        const cfgs = {};
        enabled.forEach(p => { cfgs[p.platform] = p; });
        setPlatformConfigs(cfgs);
      }),
    ]).finally(() => setLoading(false));
  }, []);

  // ─── Load Facebook SDK ────────────────────────────────────────────────
  useEffect(() => {
    if (document.getElementById('facebook-jssdk')) { setFbLoaded(true); return; }
    window.fbAsyncInit = function() {
      const appId = platformConfigs.facebook?.appId;
      if (!appId) return;
      window.FB.init({ appId, cookie: true, xfbml: true, version: 'v18.0' });
      setFbLoaded(true);
    };
    const script = document.createElement('script');
    script.id = 'facebook-jssdk';
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, [platformConfigs]);

  // ─── Facebook OAuth Login ─────────────────────────────────────────────
  const handleFacebookLogin = () => {
    if (!window.FB) {
      toast.error(isAr ? 'فشل تحميل Facebook SDK. تأكد من إدخال App ID في إعدادات المنصات.' : 'Facebook SDK failed to load. Make sure App ID is set in platform settings.');
      return;
    }
    setConnecting(true);
    window.FB.login(function(response) {
      if (response.authResponse) {
        const accessToken = response.authResponse.accessToken;
        // Send to backend to fetch user's pages
        axios.post(`${API}/pages/facebook/connect`, { accessToken })
          .then(r => {
            setPages(prev => [...prev.filter(p => p.platform !== 'facebook'), ...r.data]);
            toast.success(isAr ? `✅ تم ربط ${r.data.length} صفحة` : `✅ Connected ${r.data.length} page(s)`);
            setModal(null);
          })
          .catch(err => toast.error(err.response?.data?.error || (isAr ? 'فشل الربط' : 'Connection failed')))
          .finally(() => setConnecting(false));
      } else {
        setConnecting(false);
        toast.error(isAr ? 'تم إلغاء تسجيل الدخول' : 'Login cancelled');
      }
    }, { scope: 'pages_show_list,pages_messaging,pages_manage_posts,pages_read_engagement,instagram_basic,instagram_manage_messages,instagram_manage_comments' });
  };

  // ─── Instagram OAuth (via Facebook) ───────────────────────────────────
  const handleInstagramLogin = () => {
    if (!window.FB) {
      toast.error(isAr ? 'فشل تحميل Facebook SDK' : 'Facebook SDK not loaded');
      return;
    }
    setConnecting(true);
    window.FB.login(function(response) {
      if (response.authResponse) {
        const accessToken = response.authResponse.accessToken;
        // Get pages first, then find instagram accounts
        axios.get(`https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}&fields=id,name,instagram_business_account`)
          .then(async (resp) => {
            const pagesWithIG = (resp.data.data || []).filter(p => p.instagram_business_account);
            if (pagesWithIG.length === 0) {
              toast.error(isAr ? 'لا توجد حسابات إنستغرام بزنس مرتبطة بصفحاتك' : 'No Instagram Business accounts linked to your pages');
              setConnecting(false);
              return;
            }
            // Connect each IG account
            let connected = 0;
            for (const page of pagesWithIG) {
              try {
                const r = await axios.post(`${API}/pages/instagram/connect`, {
                  accessToken,
                  igAccountId: page.instagram_business_account.id
                });
                setPages(prev => [...prev.filter(p => !(p.platform === 'instagram' && p.pageId === r.data.pageId)), r.data]);
                connected++;
              } catch (e) {}
            }
            toast.success(isAr ? `✅ تم ربط ${connected} حساب إنستغرام` : `✅ Connected ${connected} Instagram account(s)`);
            setModal(null);
          })
          .catch(err => toast.error(isAr ? 'فشل جلب الحسابات' : 'Failed to fetch accounts'))
          .finally(() => setConnecting(false));
      } else {
        setConnecting(false);
        toast.error(isAr ? 'تم إلغاء تسجيل الدخول' : 'Login cancelled');
      }
    }, { scope: 'pages_show_list,instagram_basic,instagram_manage_messages,instagram_manage_comments' });
  };

  // ─── Telegram / WhatsApp / TikTok (manual token) ──────────────────────
  const handleManualConnect = async (platform) => {
    setConnecting(true);
    try {
      let res;
      if (platform === 'telegram') {
        res = await axios.post(`${API}/pages/telegram/connect`, form);
      } else if (platform === 'whatsapp') {
        res = await axios.post(`${API}/pages/whatsapp/connect`, form);
      } else if (platform === 'tiktok') {
        res = await axios.post(`${API}/pages/tiktok/connect`, form);
      }
      if (res) {
        setPages(prev => [...prev.filter(p => !(p.platform === platform && p.pageId === res.data.pageId)), res.data]);
        toast.success(isAr ? 'تم الربط بنجاح' : 'Connected successfully');
        setModal(null); setForm({});
      }
    } catch (err) {
      toast.error(err.response?.data?.error || (isAr ? 'فشل الاتصال' : 'Connection failed'));
    } finally { setConnecting(false); }
  };

  const handleDisconnect = async (id) => {
    if (!window.confirm(isAr ? 'هل أنت متأكد من قطع الاتصال؟' : 'Disconnect this page?')) return;
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
          <h1>{isAr ? '🔗 الصفحات المرتبطة' : '🔗 Connected Pages'}</h1>
          <p style={{ color: '#64748b' }}>{isAr ? 'اربط حساباتك الحقيقية واختر الصفحات التي تريد إدارتها' : 'Connect your real accounts and choose pages to manage'}</p>
        </div>
      </div>

      {/* Connect buttons */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 600 }}>{isAr ? 'ربط منصة جديدة' : 'Connect New Platform'}</h3>
        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 14 }}>
          {isAr ? 'اضغط على المنصة لتسجيل الدخول بحسابك الحقيقي واختيار صفحاتك' : 'Click a platform to login with your real account and select your pages'}
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {enabledPlatforms.map(platform => {
            const info = PLATFORM_INFO[platform];
            if (!info) return null;
            const handleClick = () => {
              if (platform === 'facebook') handleFacebookLogin();
              else if (platform === 'instagram') handleInstagramLogin();
              else { setModal(platform); setForm({}); }
            };
            return (
              <button key={platform} onClick={handleClick} disabled={connecting}
                className="btn btn-outline" style={{ gap: 8, borderColor: info.color + '40', color: info.color, padding: '12px 20px' }}>
                <span style={{ fontSize: 20 }}>{info.emoji}</span>
                <span>{isAr ? `ربط ${info.label}` : `Connect ${info.label}`}</span>
              </button>
            );
          })}
          {enabledPlatforms.length === 0 && (
            <p style={{ color: '#64748b', fontSize: 13 }}>
              {isAr ? 'لا توجد منصات مفعلة. اطلب من الأدمن تفعيل المنصات من لوحة التحكم.' : 'No platforms enabled. Ask admin to enable platforms.'}
            </p>
          )}
        </div>
      </div>

      {/* Connected pages list */}
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
            <p>{isAr ? 'لم تربط أي صفحة بعد. اضغط على أي منصة أعلاه للبدء.' : 'No pages connected. Click any platform above to start.'}</p>
          </div>
        )}
      </div>

      {/* Manual connect modal (Telegram / WhatsApp / TikTok) */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">{isAr ? `ربط ${PLATFORM_INFO[modal]?.label}` : `Connect ${PLATFORM_INFO[modal]?.label}`}</h3>

            {modal === 'telegram' && (
              <div>
                <p style={{ fontSize: 13, color: '#64748b', marginBottom: 14, lineHeight: 1.7 }}>
                  {isAr
                    ? '1. افتح تيليجرام وابحث عن @BotFather\n2. أرسل /newbot وأنشئ بوت\n3. انسخ الـ Bot Token هنا'
                    : '1. Open Telegram → @BotFather\n2. Send /newbot and create a bot\n3. Paste the Bot Token below'}
                </p>
                <input className="input" placeholder="Bot Token (e.g. 7123456789:AAH...)" value={form.botToken || ''} onChange={e => setForm({ ...form, botToken: e.target.value })} style={{ marginBottom: 12 }} />
                <input className="input" placeholder={isAr ? 'Chat ID (اختياري — للقنوات)' : 'Chat ID (optional — for channels)'} value={form.chatId || ''} onChange={e => setForm({ ...form, chatId: e.target.value })} style={{ marginBottom: 16 }} />
              </div>
            )}

            {modal === 'whatsapp' && (
              <div>
                <p style={{ fontSize: 13, color: '#64748b', marginBottom: 14, lineHeight: 1.7 }}>
                  {isAr
                    ? 'أدخل بيانات WhatsApp Business API من لوحة Meta Business'
                    : 'Enter your WhatsApp Business API details from Meta Business Suite'}
                </p>
                <input className="input" placeholder="Phone Number ID" value={form.phoneNumberId || ''} onChange={e => setForm({ ...form, phoneNumberId: e.target.value })} style={{ marginBottom: 12 }} />
                <input className="input" placeholder="Permanent Access Token" value={form.accessToken || ''} onChange={e => setForm({ ...form, accessToken: e.target.value })} style={{ marginBottom: 16 }} />
              </div>
            )}

            {modal === 'tiktok' && (
              <div>
                <p style={{ fontSize: 13, color: '#64748b', marginBottom: 14, lineHeight: 1.7 }}>
                  {isAr
                    ? 'أدخل بيانات TikTok Developer App'
                    : 'Enter your TikTok Developer App credentials'}
                </p>
                <input className="input" placeholder="Access Token" value={form.accessToken || ''} onChange={e => setForm({ ...form, accessToken: e.target.value })} style={{ marginBottom: 12 }} />
                <input className="input" placeholder="Open ID" value={form.openId || ''} onChange={e => setForm({ ...form, openId: e.target.value })} style={{ marginBottom: 16 }} />
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(null)} className="btn btn-outline">{isAr ? 'إلغاء' : 'Cancel'}</button>
              <button onClick={() => handleManualConnect(modal)} className="btn btn-primary" disabled={connecting}>
                {connecting ? '⏳' : (isAr ? '🔗 ربط' : '🔗 Connect')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
