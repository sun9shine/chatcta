import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || '/api';
const PLATFORM_EMOJI = { facebook: '📘', instagram: '📸', whatsapp: '💬', telegram: '✈️', tiktok: '🎵' };

export default function CommentFlow() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [comments, setComments] = useState([]);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ platform: '', pageId: '', postId: '' });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchComments = async () => {
    const params = new URLSearchParams({ page, limit: 20, ...filter });
    const res = await axios.get(`${API}/messages/comments?${params}`);
    setComments(res.data.comments);
    setTotal(res.data.total);
  };

  useEffect(() => {
    Promise.all([
      fetchComments(),
      axios.get(`${API}/pages`).then(r => setPages(r.data))
    ]).finally(() => setLoading(false));
  }, [page, filter]);

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>{isAr ? 'تدفق التعليقات' : 'Comment Flow'}</h1>
        <p style={{ color: '#64748b' }}>{isAr ? 'متابعة التعليقات والردود التلقائية' : 'Track comments and auto replies'}</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <select className="input" value={filter.platform} onChange={e => setFilter({ ...filter, platform: e.target.value })} style={{ width: 160 }}>
          <option value="">{isAr ? 'كل المنصات' : 'All Platforms'}</option>
          {['facebook', 'instagram', 'tiktok'].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="input" value={filter.pageId} onChange={e => setFilter({ ...filter, pageId: e.target.value })} style={{ width: 200 }}>
          <option value="">{isAr ? 'كل الصفحات' : 'All Pages'}</option>
          {pages.map(p => <option key={p._id} value={p._id}>{p.pageName}</option>)}
        </select>
        <input className="input" placeholder={isAr ? 'معرف المنشور' : 'Post ID'} value={filter.postId} onChange={e => setFilter({ ...filter, postId: e.target.value })} style={{ width: 200 }} />
      </div>

      <div className="card p-0">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>{isAr ? 'المنصة' : 'Platform'}</th>
                <th>{isAr ? 'المعلق' : 'Commenter'}</th>
                <th>{isAr ? 'التعليق' : 'Comment'}</th>
                <th>{isAr ? 'تم الرد' : 'Replied'}</th>
                <th>{isAr ? 'تم الإرسال' : 'DM Sent'}</th>
                <th>{isAr ? 'التاريخ' : 'Date'}</th>
              </tr>
            </thead>
            <tbody>
              {comments.map(c => (
                <tr key={c._id}>
                  <td><span style={{ fontSize: 20 }}>{PLATFORM_EMOJI[c.platform]}</span></td>
                  <td style={{ fontSize: 13 }}>{c.senderName || c.senderId || '-'}</td>
                  <td style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>{c.content}</td>
                  <td>
                    {c.reply?.sent
                      ? <span className="badge badge-success">✓ {isAr ? 'نعم' : 'Yes'}</span>
                      : <span className="badge badge-danger">✕ {isAr ? 'لا' : 'No'}</span>}
                  </td>
                  <td>
                    {c.dmSent
                      ? <span className="badge badge-success">✓</span>
                      : <span className="badge" style={{ background: '#334155', color: '#64748b' }}>-</span>}
                  </td>
                  <td style={{ fontSize: 12, color: '#64748b' }}>{new Date(c.createdAt).toLocaleDateString(isAr ? 'ar' : 'en')}</td>
                </tr>
              ))}
              {comments.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>{isAr ? 'لا توجد تعليقات' : 'No comments'}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {total > 20 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
          {page > 1 && <button onClick={() => setPage(p => p - 1)} className="btn btn-outline btn-sm">←</button>}
          <span style={{ fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center' }}>{page} / {Math.ceil(total / 20)}</span>
          {page < Math.ceil(total / 20) && <button onClick={() => setPage(p => p + 1)} className="btn btn-outline btn-sm">→</button>}
        </div>
      )}
    </div>
  );
}
