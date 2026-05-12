import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../store/authStore';

const API = process.env.REACT_APP_API_URL || '/api';

export default function AdminSupport() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    axios.get(`${API}/support/admin/all`).then(r => setMessages(r.data));
  }, []);

  // Group by sender
  const threads = messages.reduce((acc, msg) => {
    const key = msg.from?._id;
    if (!key) return acc;
    if (!acc[key]) acc[key] = { user: msg.from, messages: [], unread: 0 };
    acc[key].messages.push(msg);
    if (!msg.isRead && msg.from?._id !== user?._id) acc[key].unread++;
    return acc;
  }, {});

  const handleReply = async (userId, threadId) => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const res = await axios.post(`${API}/support/admin/reply`, { userId, content: reply, threadId });
      setMessages(prev => [...prev, res.data]);
      setReply('');
      toast.success(isAr ? 'تم الإرسال' : 'Sent');
    } catch { toast.error('Error'); }
    finally { setSending(false); }
  };

  const threadArr = Object.values(threads);
  const selectedThread = selected ? threads[selected] : null;

  return (
    <div>
      <div className="page-header">
        <h1>🎧 {isAr ? 'رسائل الدعم الفني' : 'Support Messages'}</h1>
        <p style={{ color: '#64748b' }}>{isAr ? 'إدارة محادثات المستخدمين' : 'Manage user conversations'}</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, height: 600 }}>
        {/* Thread list */}
        <div className="card" style={{ padding: 0, overflow: 'auto' }}>
          {threadArr.length === 0 && <p style={{ padding: 20, color: '#64748b', fontSize: 13 }}>{isAr ? 'لا توجد رسائل' : 'No messages'}</p>}
          {threadArr.map(t => (
            <div key={t.user._id} onClick={() => setSelected(t.user._id)}
              style={{ padding: '14px 16px', cursor: 'pointer', borderBottom: '1px solid #334155', background: selected === t.user._id ? 'rgba(99,102,241,0.1)' : 'transparent', transition: 'background 0.2s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>{t.user.name}</p>
                  <p style={{ fontSize: 12, color: '#64748b' }}>{t.user.email}</p>
                  <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{t.messages[t.messages.length - 1]?.content?.slice(0, 40)}...</p>
                </div>
                {t.unread > 0 && <span style={{ background: '#6366f1', color: 'white', borderRadius: '100%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{t.unread}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Chat */}
        <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
          {!selectedThread ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
              <p>{isAr ? 'اختر محادثة' : 'Select a conversation'}</p>
            </div>
          ) : (
            <>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155', fontWeight: 600 }}>
                {selectedThread.user.name} <span style={{ fontSize: 12, color: '#64748b', fontWeight: 400 }}>({selectedThread.user.email})</span>
              </div>
              <div style={{ flex: 1, overflow: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {selectedThread.messages.map(msg => {
                  const isAdmin = msg.isAdminReply;
                  return (
                    <div key={msg._id} style={{ display: 'flex', justifyContent: isAdmin ? 'flex-end' : 'flex-start' }}>
                      <div style={{ maxWidth: '70%', padding: '10px 14px', borderRadius: 12, background: isAdmin ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#334155', fontSize: 13 }}>
                        <p>{msg.content}</p>
                        <p style={{ fontSize: 10, marginTop: 6, opacity: 0.6 }}>{new Date(msg.createdAt).toLocaleString(isAr ? 'ar' : 'en')}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ padding: '12px 16px', borderTop: '1px solid #334155', display: 'flex', gap: 8 }}>
                <input className="input" placeholder={isAr ? 'رد...' : 'Reply...'} value={reply} onChange={e => setReply(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleReply(selected, selectedThread.messages[0]?.threadId)} />
                <button onClick={() => handleReply(selected, selectedThread.messages[0]?.threadId)} className="btn btn-primary" disabled={sending || !reply.trim()}>
                  {isAr ? 'إرسال' : 'Send'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
