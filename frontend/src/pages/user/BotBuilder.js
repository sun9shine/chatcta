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

  // ── Action helpers ──────────────────────────────────────────────────────
  const addAction = () => setBot(prev => ({
    ...prev,
    actions: [...prev.actions, {
      type: 'comment', message: '', imageUrl: '', linkUrl: '', linkText: '',
      delay: 0, language: 'both',
      replies: []
    }]
  }));
  const removeAction = (i) => setBot(prev => ({ ...prev, actions: prev.actions.filter((_, idx) => idx !== i) }));
  const updateAction = (i, patch) => setBot(prev => {
    const a = [...prev.actions];
    a[i] = { ...a[i], ...patch };
    return { ...prev, actions: a };
  });

  // ── Reply helpers (inside an action) ───────────────────────────────────
  const addReply = (actionIdx) => setBot(prev => {
    const a = [...prev.actions];
    const replies = [...(a[actionIdx].replies || [])];
    replies.push({ message: '', imageUrl: '', linkUrl: '', linkText: '', delay: 0, delayEnabled: false, isEnabled: true, order: replies.length });
    a[actionIdx] = { ...a[actionIdx], replies };
    return { ...prev, actions: a };
  });
  const removeReply = (actionIdx, replyIdx) => setBot(prev => {
    const a = [...prev.actions];
    const replies = a[actionIdx].replies.filter((_, idx) => idx !== replyIdx)
      .map((r, idx) => ({ ...r, order: idx }));
    a[actionIdx] = { ...a[actionIdx], replies };
    return { ...prev, actions: a };
  });
  const updateReply = (actionIdx, replyIdx, patch) => setBot(prev => {
    const a = [...prev.actions];
    const replies = [...a[actionIdx].replies];
    replies[replyIdx] = { ...replies[replyIdx], ...patch };
    a[actionIdx] = { ...a[actionIdx], replies };
    return { ...prev, actions: a };
  });
  const moveReply = (actionIdx, replyIdx, dir) => setBot(prev => {
    const a = [...prev.actions];
    const replies = [...a[actionIdx].replies];
    const target = replyIdx + dir;
    if (target < 0 || target >= replies.length) return prev;
    [replies[replyIdx], replies[target]] = [replies[target], replies[replyIdx]];
    replies.forEach((r, idx) => r.order = idx);
    a[actionIdx] = { ...a[actionIdx], replies };
    return { ...prev, actions: a };
  });

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
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>⚡ {isAr ? 'الإجراءات' : 'Actions'}</h3>
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
              {isAr
                ? 'يمكنك إضافة عدة إجراءات. كل إجراء من نوع "تعليق" يدعم ردوداً متعددة متسلسلة.'
                : 'Add multiple actions. Each "Comment" action supports multiple sequential replies.'}
            </p>
          </div>
          <button onClick={addAction} className="btn btn-sm btn-primary">
            + {isAr ? 'إضافة إجراء' : 'Add Action'}
          </button>
        </div>

        {bot.actions.map((action, ai) => (
          <div key={ai} style={{ background: '#0f172a', borderRadius: 14, padding: 18, marginBottom: 16, border: '1px solid #334155' }}>
            {/* Action header */}
            <div className="flex-between" style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', borderRadius: 8, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>
                  {isAr ? `إجراء ${ai + 1}` : `Action ${ai + 1}`}
                </span>
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  {action.type === 'comment' ? '💬' : action.type === 'dm' ? '📩' : '👍'}
                  {' '}
                  {action.type === 'comment'
                    ? (isAr ? 'تعليق' : 'Comment')
                    : action.type === 'dm'
                    ? (isAr ? 'رسالة خاصة' : 'Direct Message')
                    : (isAr ? 'تفاعل' : 'Reaction')}
                </span>
              </div>
              {bot.actions.length > 1 && (
                <button onClick={() => removeAction(ai)}
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 12 }}>
                  {isAr ? 'حذف الإجراء' : 'Remove'}
                </button>
              )}
            </div>

            {/* Action type + language */}
            <div className="grid grid-2" style={{ marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>
                  {isAr ? 'نوع الإجراء' : 'Action Type'}
                </label>
                <select className="input" value={action.type}
                  onChange={e => updateAction(ai, { type: e.target.value })}>
                  <option value="comment">{isAr ? 'تعليق (رد على التعليق)' : 'Comment Reply'}</option>
                  <option value="dm">{isAr ? 'رسالة مباشرة (DM)' : 'Direct Message (DM)'}</option>
                  <option value="reaction">{isAr ? 'تفاعل' : 'Reaction'}</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>
                  {isAr ? 'اللغة' : 'Language'}
                </label>
                <select className="input" value={action.language || 'both'}
                  onChange={e => updateAction(ai, { language: e.target.value })}>
                  <option value="both">{isAr ? 'عربي وإنجليزي' : 'Arabic & English'}</option>
                  <option value="ar">{isAr ? 'عربي فقط' : 'Arabic only'}</option>
                  <option value="en">{isAr ? 'إنجليزي فقط' : 'English only'}</option>
                </select>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════
                COMMENT action → multi-reply mode
                DM / other    → single message (legacy)
            ════════════════════════════════════════════════════════ */}
            {action.type === 'comment' && !bot.useAI ? (
              <div>
                {/* Replies list */}
                {(action.replies || []).length === 0 && (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: '#475569', fontSize: 13, borderRadius: 10, border: '1px dashed #334155', marginBottom: 12 }}>
                    <p style={{ fontSize: 28, marginBottom: 6 }}>💬</p>
                    <p>{isAr ? 'لا توجد ردود بعد — أضف رداً أو أكثر أدناه' : 'No replies yet — add one or more below'}</p>
                  </div>
                )}

                {(action.replies || []).map((reply, ri) => (
                  <div key={ri} style={{
                    background: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 10,
                    border: reply.isEnabled ? '1px solid #334155' : '1px solid rgba(239,68,68,0.25)',
                    opacity: reply.isEnabled ? 1 : 0.55,
                    transition: 'all 0.2s'
                  }}>
                    {/* Reply header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {/* Order arrows */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <button onClick={() => moveReply(ai, ri, -1)} disabled={ri === 0}
                            style={{ background: 'none', border: 'none', color: ri === 0 ? '#334155' : '#6366f1', cursor: ri === 0 ? 'default' : 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}>▲</button>
                          <button onClick={() => moveReply(ai, ri, 1)} disabled={ri === (action.replies.length - 1)}
                            style={{ background: 'none', border: 'none', color: ri === (action.replies.length - 1) ? '#334155' : '#6366f1', cursor: ri === (action.replies.length - 1) ? 'default' : 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}>▼</button>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#818cf8' }}>
                          {isAr ? `رد ${ri + 1}` : `Reply ${ri + 1}`}
                        </span>
                        {/* Enable/Disable toggle */}
                        <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                          <label className="switch" style={{ width: 36, height: 20 }}>
                            <input type="checkbox" checked={reply.isEnabled !== false}
                              onChange={e => updateReply(ai, ri, { isEnabled: e.target.checked })} />
                            <span className="slider" style={{ borderRadius: 20 }}></span>
                          </label>
                          <span style={{ fontSize: 11, color: reply.isEnabled !== false ? '#10b981' : '#ef4444' }}>
                            {reply.isEnabled !== false
                              ? (isAr ? 'مفعّل' : 'Enabled')
                              : (isAr ? 'معطّل' : 'Disabled')}
                          </span>
                        </label>
                      </div>
                      <button onClick={() => removeReply(ai, ri)}
                        style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>✕</button>
                    </div>

                    {/* Reply message */}
                    <div style={{ marginBottom: 10 }}>
                      <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>
                        {isAr ? 'نص الرد' : 'Reply Text'}
                      </label>
                      <textarea className="input" rows={2} value={reply.message || ''}
                        onChange={e => updateReply(ai, ri, { message: e.target.value })}
                        placeholder={isAr ? `نص الرد ${ri + 1}...` : `Reply ${ri + 1} text...`} />
                    </div>

                    {/* Image + Link */}
                    <div className="grid grid-2" style={{ marginBottom: 10 }}>
                      <div>
                        <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>
                          🖼️ {isAr ? 'رابط صورة (اختياري)' : 'Image URL (optional)'}
                        </label>
                        <input className="input" value={reply.imageUrl || ''}
                          onChange={e => updateReply(ai, ri, { imageUrl: e.target.value })}
                          placeholder="https://..." />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>
                          🔗 {isAr ? 'رابط (اختياري)' : 'Link URL (optional)'}
                        </label>
                        <input className="input" value={reply.linkUrl || ''}
                          onChange={e => updateReply(ai, ri, { linkUrl: e.target.value })}
                          placeholder="https://your-link.com" />
                      </div>
                    </div>
                    {reply.linkUrl && (
                      <div style={{ marginBottom: 10 }}>
                        <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>
                          {isAr ? 'نص الرابط' : 'Link text'}
                        </label>
                        <input className="input" value={reply.linkText || ''}
                          onChange={e => updateReply(ai, ri, { linkText: e.target.value })}
                          placeholder={isAr ? 'اضغط هنا' : 'Click here'} />
                      </div>
                    )}

                    {/* ── Delay (optional toggle) ───────────────── */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#0f172a', borderRadius: 8, padding: '8px 12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', flexShrink: 0 }}>
                        <label className="switch" style={{ width: 36, height: 20 }}>
                          <input type="checkbox" checked={!!reply.delayEnabled}
                            onChange={e => updateReply(ai, ri, { delayEnabled: e.target.checked, delay: e.target.checked ? (reply.delay || 5) : 0 })} />
                          <span className="slider" style={{ borderRadius: 20 }}></span>
                        </label>
                        <span style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                          ⏱️ {isAr ? 'تأخير' : 'Delay'}
                        </span>
                      </label>
                      {reply.delayEnabled && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                          <input type="range" min="1" max="300" step="1"
                            value={reply.delay || 5}
                            onChange={e => updateReply(ai, ri, { delay: Number(e.target.value) })}
                            style={{ flex: 1, accentColor: '#6366f1' }} />
                          <span style={{ fontSize: 12, color: '#818cf8', fontWeight: 700, minWidth: 52, textAlign: 'center' }}>
                            {reply.delay || 5}{isAr ? ' ثانية' : 's'}
                          </span>
                        </div>
                      )}
                      {!reply.delayEnabled && (
                        <span style={{ fontSize: 11, color: '#475569' }}>
                          {isAr ? 'الإرسال فوري' : 'Sent immediately'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {/* Add reply button */}
                <button onClick={() => addReply(ai)}
                  style={{ width: '100%', background: 'rgba(99,102,241,0.08)', border: '1px dashed rgba(99,102,241,0.4)', color: '#818cf8', borderRadius: 10, padding: '10px 0', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <span style={{ fontSize: 18 }}>+</span>
                  {isAr ? 'إضافة رد آخر على هذا التعليق' : 'Add another reply to this comment'}
                </button>
              </div>
            ) : action.type !== 'comment' && !bot.useAI ? (
              /* DM / legacy single message */
              <div>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>
                    {isAr ? 'نص الرسالة' : 'Message Text'}
                  </label>
                  <textarea className="input" rows={3} value={action.message || ''}
                    onChange={e => updateAction(ai, { message: e.target.value })}
                    placeholder={isAr ? 'نص الرسالة التلقائية...' : 'Auto reply text...'} />
                </div>
                <div className="grid grid-2" style={{ marginBottom: 10 }}>
                  <div>
                    <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>
                      🖼️ {isAr ? 'رابط صورة (اختياري)' : 'Image URL (optional)'}
                    </label>
                    <input className="input" value={action.imageUrl || ''}
                      onChange={e => updateAction(ai, { imageUrl: e.target.value })}
                      placeholder="https://image..." />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>
                      🔗 {isAr ? 'رابط (اختياري)' : 'Link URL (optional)'}
                    </label>
                    <input className="input" value={action.linkUrl || ''}
                      onChange={e => updateAction(ai, { linkUrl: e.target.value })}
                      placeholder="https://your-link.com" />
                  </div>
                </div>
                {action.linkUrl && (
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }}>
                      {isAr ? 'نص الرابط (اختياري)' : 'Link Text (optional)'}
                    </label>
                    <input className="input" value={action.linkText || ''}
                      onChange={e => updateAction(ai, { linkText: e.target.value })}
                      placeholder={isAr ? 'اضغط هنا للمزيد' : 'Click here for more'} />
                  </div>
                )}
                {/* Delay toggle for DM */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#0f172a', borderRadius: 8, padding: '8px 12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', flexShrink: 0 }}>
                    <label className="switch" style={{ width: 36, height: 20 }}>
                      <input type="checkbox" checked={(action.delay || 0) > 0}
                        onChange={e => updateAction(ai, { delay: e.target.checked ? 5 : 0 })} />
                      <span className="slider" style={{ borderRadius: 20 }}></span>
                    </label>
                    <span style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      ⏱️ {isAr ? 'تأخير' : 'Delay'}
                    </span>
                  </label>
                  {(action.delay || 0) > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                      <input type="range" min="1" max="300" step="1"
                        value={action.delay || 5}
                        onChange={e => updateAction(ai, { delay: Number(e.target.value) })}
                        style={{ flex: 1, accentColor: '#6366f1' }} />
                      <span style={{ fontSize: 12, color: '#818cf8', fontWeight: 700, minWidth: 52, textAlign: 'center' }}>
                        {action.delay || 5}{isAr ? ' ثانية' : 's'}
                      </span>
                    </div>
                  )}
                  {(action.delay || 0) === 0 && (
                    <span style={{ fontSize: 11, color: '#475569' }}>
                      {isAr ? 'الإرسال فوري' : 'Sent immediately'}
                    </span>
                  )}
                </div>
              </div>
            ) : bot.useAI ? (
              /* AI mode info card */
              <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#a78bfa' }}>
                🧠 {isAr
                  ? 'سيتولى الذكاء الاصطناعي صياغة الرد بناءً على التعليمات أعلاه.'
                  : 'AI will generate the reply based on your system prompt above.'}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
