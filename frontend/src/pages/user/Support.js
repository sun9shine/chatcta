import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../store/authStore';

const API = process.env.REACT_APP_API_URL || '/api';

export default function Support() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState('');
  const [sending, setSending] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    axios.get(`${API}/support`).then(r => setMessages(r.data));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSending(true);
    try {
      const res = await axios.post(`${API}/support`, { content, subject, threadId: messages[0]?.threadId });
      setMessages(prev => [...prev, res.data]);
      setContent(''); setSubject(''); setShowNew(false);
      toast.success(isAr ? 'تم إرسال الرسالة' : 'Message sent');
    } catch { toast.error(isAr ? 'فشل الإرسال' : 'Failed to send'); }
    finally { setSending(false); }
  };

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1>{isAr ? 'الدعم الفني' : 'Support'}</h1>
          <p style={{ color: '#64748b' }}>{isAr ? 'تواصل مع فريق الدعم' : 'Contact support team'}</p>
        </div>
        <button onClick={() => setShowNew(!showNew)} className="btn btn-primary">+ {isAr ? 'رسالة جديدة' : 'New Message'}</button>
      </div>

      {showNew && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 600 }}>{isAr ? 'رسالة جديدة' : 'New Message'}</h3>
          <form onSubmit={handleSend}>
            <input className="input" placeholder={isAr ? 'الموضوع (اختياري)' : 'Subject (optional)'} value={subject} onChange={e => setSubject(e.target.value)} style={{ marginBottom: 10 }} />
            <textarea className="input" rows={4} placeholder={isAr ? 'اكتب رسالتك هنا...' : 'Write your message here...'} value={content} onChange={e => setContent(e.target.value)} required style={{ marginBottom: 10 }} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowNew(false)} className="btn btn-outline btn-sm">{isAr ? 'إلغاء' : 'Cancel'}</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={sending}>{sending ? '...' : (isAr ? 'إرسال' : 'Send')}</button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ height: 500, overflow: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.length === 0 && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#64748b' }}>
              <span style={{ fontSize: 40, marginBottom: 12 }}>🎧</span>
              <p>{isAr ? 'لا توجد رسائل بعد. أرسل رسالتك الأولى!' : 'No messages yet. Send your first message!'}</p>
            </div>
          )}
          {messages.map(msg => {
            const isMe = msg.from?._id === user?._id || msg.from === user?._id;
            return (
              <div key={msg._id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '70%', padding: '12px 16px', borderRadius: 14,
                  background: isMe ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#334155',
                  fontSize: 14, lineHeight: 1.6
                }}>
                  {!isMe && <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4, fontWeight: 600 }}>
                    {msg.from?.name || (isAr ? 'فريق الدعم' : 'Support Team')}
                  </p>}
                  {msg.subject && <p style={{ fontSize: 11, fontWeight: 700, marginBottom: 4, color: isMe ? 'rgba(255,255,255,0.7)' : '#94a3b8' }}>{msg.subject}</p>}
                  <p>{msg.content}</p>
                  <p style={{ fontSize: 10, marginTop: 6, color: isMe ? 'rgba(255,255,255,0.5)' : '#475569' }}>
                    {new Date(msg.createdAt).toLocaleString(isAr ? 'ar' : 'en')}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
        <div style={{ padding: '12px 16px', borderTop: '1px solid #334155', display: 'flex', gap: 8 }}>
          <input className="input" placeholder={isAr ? 'رد سريع...' : 'Quick reply...'} value={content} onChange={e => setContent(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend(e)} />
          <button onClick={handleSend} className="btn btn-primary" disabled={sending || !content.trim()}>{isAr ? 'إرسال' : 'Send'}</button>
        </div>
      </div>
    </div>
  );
}
