import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = process.env.REACT_APP_API_URL || '/api';

export default function AdminAnnouncements() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [announcements, setAnnouncements] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', titleAr: '', content: '', contentAr: '', type: 'info', targetAll: true, isActive: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios.get(`${API}/announcements/admin/all`).then(r => setAnnouncements(r.data));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await axios.post(`${API}/announcements`, form);
      setAnnouncements(prev => [res.data, ...prev]);
      setShowModal(false); setForm({ title: '', titleAr: '', content: '', contentAr: '', type: 'info', targetAll: true, isActive: true });
      toast.success(isAr ? 'تم نشر الإعلان' : 'Announcement published');
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    await axios.delete(`${API}/announcements/${id}`);
    setAnnouncements(prev => prev.filter(a => a._id !== id));
    toast.success(isAr ? 'تم الحذف' : 'Deleted');
  };

  const typeColors = { info: '#6366f1', warning: '#f59e0b', success: '#10b981', error: '#ef4444' };

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1>📢 {isAr ? 'الإعلانات' : 'Announcements'}</h1>
          <p style={{ color: '#64748b' }}>{isAr ? 'إرسال إعلانات وتنبيهات للمستخدمين' : 'Send announcements and alerts to users'}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">+ {isAr ? 'إعلان جديد' : 'New Announcement'}</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {announcements.map(ann => (
          <div key={ann._id} className="card" style={{ borderLeft: `3px solid ${typeColors[ann.type]}` }}>
            <div className="flex-between">
              <div>
                <p style={{ fontWeight: 700, fontSize: 15 }}>{ann.title} {ann.titleAr && `/ ${ann.titleAr}`}</p>
                <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>{ann.content}</p>
                {ann.contentAr && <p style={{ fontSize: 13, color: '#94a3b8' }}>{ann.contentAr}</p>}
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <span className="badge" style={{ background: `${typeColors[ann.type]}20`, color: typeColors[ann.type] }}>{ann.type}</span>
                  {ann.targetAll && <span className="badge badge-primary">{isAr ? 'للجميع' : 'All Users'}</span>}
                  {!ann.isActive && <span className="badge badge-danger">{isAr ? 'معطل' : 'Inactive'}</span>}
                  <span style={{ fontSize: 11, color: '#475569' }}>{new Date(ann.createdAt).toLocaleDateString(isAr ? 'ar' : 'en')}</span>
                </div>
              </div>
              <button onClick={() => handleDelete(ann._id)} className="btn btn-sm btn-danger">{isAr ? 'حذف' : 'Delete'}</button>
            </div>
          </div>
        ))}
        {announcements.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>📢</p>
            <p>{isAr ? 'لا توجد إعلانات' : 'No announcements'}</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">{isAr ? 'إنشاء إعلان جديد' : 'Create Announcement'}</h3>
            <form onSubmit={handleCreate}>
              <div className="grid grid-2" style={{ marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#94a3b8' }}>{isAr ? 'العنوان (عربي)' : 'Title (AR)'}</label>
                  <input className="input" value={form.titleAr} onChange={e => setForm({ ...form, titleAr: e.target.value, title: e.target.value })} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#94a3b8' }}>Title (EN)</label>
                  <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#94a3b8' }}>{isAr ? 'المحتوى (عربي)' : 'Content (AR)'}</label>
                <textarea className="input" rows={3} value={form.contentAr} onChange={e => setForm({ ...form, contentAr: e.target.value, content: e.target.value })} required />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#94a3b8' }}>Content (EN)</label>
                <textarea className="input" rows={3} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
              </div>
              <div className="grid grid-2" style={{ marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#94a3b8' }}>{isAr ? 'النوع' : 'Type'}</label>
                  <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="success">Success</option>
                    <option value="error">Error</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, paddingBottom: 4 }}>
                  <label className="switch"><input type="checkbox" checked={form.targetAll} onChange={e => setForm({ ...form, targetAll: e.target.checked })} /><span className="slider"></span></label>
                  <span style={{ fontSize: 13 }}>{isAr ? 'للجميع' : 'All users'}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">{isAr ? 'إلغاء' : 'Cancel'}</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '...' : (isAr ? 'نشر الإعلان' : 'Publish')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
