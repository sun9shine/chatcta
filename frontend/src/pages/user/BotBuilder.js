import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = process.env.REACT_APP_API_URL || '/api';

export default function BotBuilder() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [pages, setPages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [bot, setBot] = useState({
    name: '', platform: 'facebook', type: 'comment_reply', isActive: true, useAI: false,
    aiPrompt: '', allPosts: true, targetPosts: [],
    triggers: [], actions: [{ type: 'comment', message: '', imageUrl: '', delay: 0, language: 'both' }]
  });

  useEffect(() => {
    axios.get(`${API}/pages`).then(r => setPages(r.data));
    if (isEdit) {
      axios.get(`${API}/bots/${id}`).then(r => setBot(r.data));
    }
  }, [id]);

  const addTrigger = () => setBot(prev => ({ ...prev, triggers: [...prev.triggers, { keyword: '', matchType: 'contains', caseSensitive: false }] }));
  const removeTrigger = (i) => setBot(prev => ({ ...prev, triggers: prev.triggers.filter((_, idx) => idx !== i) }));
  const addAction = () => setBot(prev => ({ ...prev, actions: [...prev.actions, { type: 'comment', message: '', imageUrl: '', delay: 0, language: 'both' }] }));
  const removeAction = (i) => setBot(prev => ({ ...prev, actions: prev.actions.filter((_, idx) => idx !== i) }));

  const handleSave = async () => {
    if (!bot.name) return toast.error(isAr ? 'أدخل اسم البوت' : 'Enter bot name');
    setSaving(true);
    try {
      if (isEdit) {
        await axios.put(`${API}/bots/${id}`, bot);
        toast.success(isAr ? 'تم تحديث البوت' : 'Bot updated');
      } else {
        await axios.post(`${API}/bots`, bot);
        toast.success(isAr ? 'تم إنشاء البوت' : 'Bot created');
      }
      navigate('/dashboard/bots');
    } catch (err) {
      toast.error(err.response?.data?.error || (isAr ? 'حدث خطأ' : 'Error'));
    } finally {
      setSaving(false);
    }
  };

  const F = ({ label, children }) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  );

  return (
    <div style={{ maxWidth: 800 }}>
      <div className="page-header flex-between">
        <div>
          <h1>{isEdit ? (isAr ? 'تعديل البوت' : 'Edit Bot') : (isAr ? 'إنشاء بوت جديد' : 'Create New Bot')}</h1>
          <p style={{ color: '#64748b' }}>{isAr ? 'اضبط إعدادات البوت والإجراءات التلقائية' : 'Configure bot settings and automatic actions'}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => navigate('/dashboard/bots')} className="btn btn-outline">{isAr ? 'إلغاء' : 'Cancel'}</button>
          <button onClick={handleSave} className="btn btn-primary" disabled={saving}>{saving ? '...' : (isAr ? 'حفظ البوت' : 'Save Bot')}</button>
        </div>
      </div>

      {/* Basic Settings */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 20, fontSize: 16, fontWeight: 600 }}>⚙️ {isAr ? 'الإعدادات الأساسية' : 'Basic Settings'}</h3>
        <div className="grid grid-2">
          <F label={isAr ? 'اسم البوت' : 'Bot Name'}>
            <input className="input" value={bot.name} onChange={e => setBot({ ...bot, name: e.target.value })} placeholder={isAr ? 'مثال: بوت الرد التلقائي' : 'e.g., Auto Reply Bot'} />
          </F>
          <F label={isAr ? 'المنصة' : 'Platform'}>
            <select className="input" value={bot.platform} onChange={e => setBot({ ...bot, platform: e.target.value })}>
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="telegram">Telegram</option>
              <option value="tiktok">TikTok</option>
              <option value="all">{isAr ? 'كل المنصات' : 'All Platforms'}</option>
            </select>
          </F>
        </div>
        <div className="grid grid-2">
          <F label={isAr ? 'نوع البوت' : 'Bot Type'}>
            <select className="input" value={bot.type} onChange={e => setBot({ ...bot, type: e.target.value })}>
              <option value="comment_reply">{isAr ? 'رد على التعليقات' : 'Comment Reply'}</option>
              <option value="dm_reply">{isAr ? 'رد على الرسائل' : 'DM Reply'}</option>
              <option value="post_dm">{isAr ? 'رسالة بعد التعليق' : 'Post Comment DM'}</option>
              <option value="keyword">{isAr ? 'كلمات مفتاحية' : 'Keyword Trigger'}</option>
              <option value="ai">{isAr ? 'ذكاء اصطناعي' : 'AI Bot'}</option>
              <option value="sequence">{isAr ? 'تسلسل رسائل' : 'Message Sequence'}</option>
            </select>
          </F>
          <F label={isAr ? 'الصفحة' : 'Page'}>
            <select className="input" value={bot.pageId || ''} onChange={e => setBot({ ...bot, pageId: e.target.value })}>
              <option value="">{isAr ? 'كل الصفحات' : 'All Pages'}</option>
              {pages.filter(p => bot.platform === 'all' || p.platform === bot.platform).map(p => (
                <option key={p._id} value={p._id}>{p.pageName}</option>
              ))}
            </select>
          </F>
        </div>

        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <label className="switch"><input type="checkbox" checked={bot.isActive} onChange={e => setBot({ ...bot, isActive: e.target.checked })} /><span className="slider"></span></label>
            <span style={{ fontSize: 13 }}>{isAr ? 'مفعل' : 'Active'}</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <label className="switch"><input type="checkbox" checked={bot.useAI} onChange={e => setBot({ ...bot, useAI: e.target.checked })} /><span className="slider"></span></label>
            <span style={{ fontSize: 13 }}>🧠 {isAr ? 'استخدام الذكاء الاصطناعي' : 'Use AI'}</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <label className="switch"><input type="checkbox" checked={bot.allPosts} onChange={e => setBot({ ...bot, allPosts: e.target.checked })} /><span className="slider"></span></label>
            <span style={{ fontSize: 13 }}>{isAr ? 'كل المنشورات' : 'All Posts'}</span>
          </label>
        </div>
      </div>

      {/* AI Prompt */}
      {bot.useAI && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600 }}>🧠 {isAr ? 'تعليمات الذكاء الاصطناعي' : 'AI Instructions'}</h3>
          <F label={isAr ? 'التعليمات (System Prompt)' : 'System Prompt'}>
            <textarea className="input" rows={4} value={bot.aiPrompt} onChange={e => setBot({ ...bot, aiPrompt: e.target.value })}
              placeholder={isAr ? 'مثال: أنت مساعد خدمة عملاء ودود، أجب بشكل مختصر باللغة العربية...' : 'e.g., You are a friendly customer service agent, reply concisely...'} />
          </F>
        </div>
      )}

      {/* Triggers */}
      {!bot.allPosts && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>🔑 {isAr ? 'الكلمات المفتاحية' : 'Keywords'}</h3>
            <button onClick={addTrigger} className="btn btn-sm btn-outline">+ {isAr ? 'إضافة' : 'Add'}</button>
          </div>
          {bot.triggers.map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
              <input className="input" value={t.keyword} onChange={e => { const tr = [...bot.triggers]; tr[i].keyword = e.target.value; setBot({ ...bot, triggers: tr }); }} placeholder={isAr ? 'الكلمة المفتاحية' : 'Keyword'} style={{ flex: 2 }} />
              <select className="input" value={t.matchType} onChange={e => { const tr = [...bot.triggers]; tr[i].matchType = e.target.value; setBot({ ...bot, triggers: tr }); }} style={{ flex: 1 }}>
                <option value="contains">{isAr ? 'يحتوي' : 'Contains'}</option>
                <option value="exact">{isAr ? 'مطابق' : 'Exact'}</option>
                <option value="starts_with">{isAr ? 'يبدأ بـ' : 'Starts with'}</option>
              </select>
              <button onClick={() => removeTrigger(i)} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: 8, width: 36, height: 36, cursor: 'pointer', fontWeight: 700 }}>✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="flex-between" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>⚡ {isAr ? 'الإجراءات' : 'Actions'}</h3>
          <button onClick={addAction} className="btn btn-sm btn-outline">+ {isAr ? 'إضافة إجراء' : 'Add Action'}</button>
        </div>
        {bot.actions.map((action, i) => (
          <div key={i} style={{ background: '#0f172a', borderRadius: 12, padding: 16, marginBottom: 12 }}>
            <div className="flex-between" style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#818cf8' }}>{isAr ? `إجراء ${i + 1}` : `Action ${i + 1}`}</span>
              {bot.actions.length > 1 && <button onClick={() => removeAction(i)} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>✕</button>}
            </div>
            <div className="grid grid-2" style={{ marginBottom: 10 }}>
              <div>
                <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>{isAr ? 'نوع الإجراء' : 'Action Type'}</label>
                <select className="input" value={action.type} onChange={e => { const a = [...bot.actions]; a[i].type = e.target.value; setBot({ ...bot, actions: a }); }}>
                  <option value="comment">{isAr ? 'تعليق' : 'Comment'}</option>
                  <option value="dm">{isAr ? 'رسالة مباشرة' : 'Direct Message'}</option>
                  <option value="reaction">{isAr ? 'تفاعل' : 'Reaction'}</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>{isAr ? 'التأخير (ثانية)' : 'Delay (seconds)'}</label>
                <input className="input" type="number" min="0" value={action.delay} onChange={e => { const a = [...bot.actions]; a[i].delay = Number(e.target.value); setBot({ ...bot, actions: a }); }} />
              </div>
            </div>
            {!bot.useAI && (
              <div>
                <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>{isAr ? 'نص الرسالة' : 'Message Text'}</label>
                <textarea className="input" rows={3} value={action.message} onChange={e => { const a = [...bot.actions]; a[i].message = e.target.value; setBot({ ...bot, actions: a }); }} placeholder={isAr ? 'نص الرد التلقائي...' : 'Auto reply text...'} style={{ marginBottom: 8 }} />
                <div className="grid grid-2" style={{ marginBottom: 8 }}>
                  <div>
                    <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>{isAr ? 'رابط صورة (اختياري)' : 'Image URL (optional)'}</label>
                    <input className="input" value={action.imageUrl || ''} onChange={e => { const a = [...bot.actions]; a[i].imageUrl = e.target.value; setBot({ ...bot, actions: a }); }} placeholder="https://image..." />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>🔗 {isAr ? 'رابط (اختياري)' : 'Link URL (optional)'}</label>
                    <input className="input" value={action.linkUrl || ''} onChange={e => { const a = [...bot.actions]; a[i].linkUrl = e.target.value; setBot({ ...bot, actions: a }); }} placeholder="https://your-link.com" />
                  </div>
                </div>
                {action.linkUrl && (
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>{isAr ? 'نص الرابط (اختياري)' : 'Link Text (optional)'}</label>
                    <input className="input" value={action.linkText || ''} onChange={e => { const a = [...bot.actions]; a[i].linkText = e.target.value; setBot({ ...bot, actions: a }); }} placeholder={isAr ? 'اضغط هنا للمزيد' : 'Click here for more'} />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
