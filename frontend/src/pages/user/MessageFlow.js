import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = process.env.REACT_APP_API_URL || '/api';

const PLATFORM_EMOJI = { facebook: '📘', instagram: '📸', whatsapp: '💬', telegram: '✈️', tiktok: '🎵' };

export default function MessageFlow() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [messages, setMessages] = useState([]);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ platform: '', pageId: '' });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showSend, setShowSend] = useState(false);
  const [sendForm, setSendForm] = useState({ pageId: '', recipientId: '', content: '', delay: 0 });
  const [image, setImage] = useState(null);
  const [sending, setSending] = useState(false);

  const fetchMessages = async () => {
    const params = new URLSearchParams({ page, limit: 20, ...filter });
    const res = await axios.get(`${API}/messages/messages?${params}`);
    setMessages(res.data.messages);
    setTotal(res.data.total);
  };

  useEffect(() => {
    Promise.all([
      fetchMessages(),
      axios.get(`${API}/pages`).then(r => setPages(r.data))
    ]).finally(() => setLoading(false));
  }, [page, filter]);

  const handleSend = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const formData = new FormData();
      Object.entries(sendForm).forEach(([k, v]) => formData.append(k, v));
      if (image) formData.append('image', image);
      const selectedPage = pages.find(p => p._id === sendForm.pageId);
      if (selectedPage) formData.append('platform', selectedPage.platform);
      await axios.post(`${API}/messages/send`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(isAr ? 'تم إرسال الرسالة' : 'Message sent');
      setShowSend(false); setSendForm({ pageId: '', recipientId: '', content: '', delay: 0 });
      fetchMessages();
    } catch (err) {
      toast.error(err.response?.data?.error || (isAr ? 'فشل الإرسال' : 'Send failed'));
    } finally {
      setSending(false);
    }
  };

  const statusColor = { pending: '#f59e0b', sent: '#10b981', delivered: '#6366f1', failed: '#ef4444' };

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>...</div>;

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1>{isAr ? 'تدفق الرسائل' : 'Message Flow'}</h1>
          <p style={{ color: '#64748b' }}>{isAr ? 'جميع الرسائل الواردة والصادرة' : 'All incoming and outgoing messages'}</p>
        </div>
        <button onClick={() => setShowSend(true)} className="btn btn-primary">+ {isAr ? 'إرسال رسالة' : 'Send Message'}</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <select className="input" value={filter.platform} onChange={e => setFilter({ ...filter, platform: e.target.value })} style={{ width: 180 }}>
          <option value="">{isAr ? 'كل المنصات' : 'All Platforms'}</option>
          {['facebook', 'instagram', 'whatsapp', 'telegram', 'tiktok'].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="input" value={filter.pageId} onChange={e => setFilter({ ...filter, pageId: e.target.value })} style={{ width: 200 }}>
          <option value="">{isAr ? 'كل الصفحات' : 'All Pages'}</option>
          {pages.map(p => <option key={p._id} value={p._id}>{p.pageName}</option>)}
        </select>
      </div>

      <div className="card p-0">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>{isAr ? 'المنصة' : 'Platform'}</th>
                <th>{isAr ? 'المرسل' : 'Sender'}</th>
                <th>{isAr ? 'الرسالة' : 'Message'}</th>
                <th>{isAr ? 'النوع' : 'Type'}</th>
                <th>{isAr ? 'الحالة' : 'Status'}</th>
                <th>{isAr ? 'التاريخ' : 'Date'}</th>
              </tr>
            </thead>
            <tbody>
              {messages.map(msg => (
                <tr key={msg._id}>
                  <td><span style={{ fontSize: 20 }}>{PLATFORM_EMOJI[msg.platform]}</span></td>
                  <td style={{ fontSize: 13 }}>{msg.senderName || msg.senderId || msg.recipientId || '-'}</td>
                  <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>{msg.content || (msg.imageUrl ? '🖼️' : '-')}</td>
                  <td><span className={`badge ${msg.type === 'incoming' ? 'badge-primary' : 'badge-success'}`}>{msg.type}</span></td>
                  <td><span className="badge" style={{ background: `${statusColor[msg.status]}20`, color: statusColor[msg.status] }}>{msg.status}</span></td>
                  <td style={{ fontSize: 12, color: '#64748b' }}>{new Date(msg.createdAt).toLocaleDateString(isAr ? 'ar' : 'en')}</td>
                </tr>
              ))}
              {messages.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>{isAr ? 'لا توجد رسائل' : 'No messages'}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
          {page > 1 && <button onClick={() => setPage(p => p - 1)} className="btn btn-outline btn-sm">←</button>}
          <span style={{ fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center' }}>{page} / {Math.ceil(total / 20)}</span>
          {page < Math.ceil(total / 20) && <button onClick={() => setPage(p => p + 1)} className="btn btn-outline btn-sm">→</button>}
        </div>
      )}

      {/* Send Modal */}
      {showSend && (
        <div className="modal-overlay" onClick={() => setShowSend(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">{isAr ? 'إرسال رسالة' : 'Send Message'}</h3>
            <form onSubmit={handleSend}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 13, color: '#94a3b8', display: 'block', marginBottom: 6 }}>{isAr ? 'الصفحة' : 'Page'}</label>
                <select className="input" value={sendForm.pageId} onChange={e => setSendForm({ ...sendForm, pageId: e.target.value })} required>
                  <option value="">{isAr ? 'اختر الصفحة' : 'Select page'}</option>
                  {pages.map(p => <option key={p._id} value={p._id}>{p.pageName} ({p.platform})</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 13, color: '#94a3b8', display: 'block', marginBottom: 6 }}>{isAr ? 'معرف المستلم' : 'Recipient ID'}</label>
                <input className="input" value={sendForm.recipientId} onChange={e => setSendForm({ ...sendForm, recipientId: e.target.value })} required />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 13, color: '#94a3b8', display: 'block', marginBottom: 6 }}>{isAr ? 'الرسالة' : 'Message'}</label>
                <textarea className="input" rows={3} value={sendForm.content} onChange={e => setSendForm({ ...sendForm, content: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 13, color: '#94a3b8', display: 'block', marginBottom: 6 }}>{isAr ? 'صورة (اختياري)' : 'Image (optional)'}</label>
                  <input type="file" accept="image/*" onChange={e => setImage(e.target.files[0])} style={{ fontSize: 12, color: '#94a3b8' }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: '#94a3b8', display: 'block', marginBottom: 6 }}>{isAr ? 'تأخير (ثانية)' : 'Delay (seconds)'}</label>
                  <input className="input" type="number" min="0" value={sendForm.delay} onChange={e => setSendForm({ ...sendForm, delay: Number(e.target.value) })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowSend(false)} className="btn btn-outline">{isAr ? 'إلغاء' : 'Cancel'}</button>
                <button type="submit" className="btn btn-primary" disabled={sending}>{sending ? '...' : (isAr ? 'إرسال' : 'Send')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
