import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = process.env.REACT_APP_API_URL || '/api';

const BOT_TYPES = {
  comment_reply: { ar: 'رد على التعليقات', en: 'Comment Reply', icon: '💬' },
  dm_reply: { ar: 'رد على الرسائل', en: 'DM Reply', icon: '📩' },
  post_dm: { ar: 'رسالة بعد التعليق', en: 'Post Comment DM', icon: '🔄' },
  keyword: { ar: 'استجابة للكلمات المفتاحية', en: 'Keyword Response', icon: '🔑' },
  ai: { ar: 'ذكاء اصطناعي', en: 'AI Bot', icon: '🧠' },
  sequence: { ar: 'تسلسل رسائل', en: 'Message Sequence', icon: '📋' },
};

export default function Bots() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const navigate = useNavigate();
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/bots`).then(r => setBots(r.data)).finally(() => setLoading(false));
  }, []);

  const handleToggle = async (id) => {
    const res = await axios.put(`${API}/bots/${id}/toggle`);
    setBots(prev => prev.map(b => b._id === id ? res.data : b));
  };

  const handleDelete = async (id) => {
    if (!window.confirm(isAr ? 'هل أنت متأكد؟' : 'Are you sure?')) return;
    await axios.delete(`${API}/bots/${id}`);
    setBots(prev => prev.filter(b => b._id !== id));
    toast.success(isAr ? 'تم حذف البوت' : 'Bot deleted');
  };

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>...</div>;

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1>{isAr ? 'البوتات' : 'Bots'}</h1>
          <p style={{ color: '#64748b' }}>{isAr ? 'أنشئ وأدر بوتات الرد التلقائي' : 'Create and manage auto-reply bots'}</p>
        </div>
        <button onClick={() => navigate('/dashboard/bots/new')} className="btn btn-primary">+ {isAr ? 'بوت جديد' : 'New Bot'}</button>
      </div>

      {bots.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80, color: '#64748b' }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>🤖</p>
          <p style={{ fontSize: 18, marginBottom: 8 }}>{isAr ? 'لا يوجد بوتات بعد' : 'No bots yet'}</p>
          <p style={{ marginBottom: 24 }}>{isAr ? 'أنشئ بوتك الأول لأتمتة الردود' : 'Create your first bot to automate replies'}</p>
          <button onClick={() => navigate('/dashboard/bots/new')} className="btn btn-primary">{isAr ? 'إنشاء بوت' : 'Create Bot'}</button>
        </div>
      ) : (
        <div className="grid grid-2">
          {bots.map(bot => {
            const typeInfo = BOT_TYPES[bot.type];
            return (
              <div key={bot._id} className="card">
                <div className="flex-between" style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ fontSize: 28 }}>{typeInfo?.icon || '🤖'}</div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 16 }}>{bot.name}</p>
                      <p style={{ fontSize: 12, color: '#64748b' }}>{isAr ? typeInfo?.ar : typeInfo?.en}</p>
                    </div>
                  </div>
                  <label className="switch">
                    <input type="checkbox" checked={bot.isActive} onChange={() => handleToggle(bot._id)} />
                    <span className="slider"></span>
                  </label>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                  {bot.platform && <span className="badge badge-primary">{bot.platform}</span>}
                  {bot.useAI && <span className="badge" style={{ background: 'rgba(139,92,246,0.15)', color: '#8b5cf6' }}>🧠 AI</span>}
                  <span className="badge badge-success">{bot.actions?.length || 0} {isAr ? 'إجراءات' : 'actions'}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, borderTop: '1px solid #334155', paddingTop: 12 }}>
                  <p style={{ fontSize: 12, color: '#64748b', flex: 1 }}>{isAr ? 'ردود:' : 'Replies:'} <strong>{bot.stats?.totalReplies || 0}</strong></p>
                  <button onClick={() => navigate(`/dashboard/bots/${bot._id}`)} className="btn btn-sm btn-outline">{isAr ? 'تعديل' : 'Edit'}</button>
                  <button onClick={() => handleDelete(bot._id)} className="btn btn-sm btn-danger">{isAr ? 'حذف' : 'Delete'}</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
