import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = process.env.REACT_APP_API_URL || '/api';

export default function AdminPublish() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ content: '', imageUrl: '', allUsers: true, userIds: [], platform: '' });
  const [image, setImage] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    axios.get(`${API}/admin/users?limit=100`).then(r => setUsers(r.data.users));
  }, []);

  const handlePublish = async (e) => {
    e.preventDefault();
    setPublishing(true); setResult(null);
    try {
      // Upload image if selected
      let imageUrl = form.imageUrl;
      if (image) {
        const formData = new FormData();
        formData.append('image', image);
        // Simple upload endpoint
        const up = await axios.post(`${API}/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).catch(() => ({ data: { url: '' } }));
        imageUrl = up.data?.url || '';
      }
      const res = await axios.post(`${API}/admin/publish`, { ...form, imageUrl });
      setResult(res.data);
      toast.success(isAr ? `تم النشر في ${res.data.published} صفحة` : `Published to ${res.data.published} pages`);
    } catch (err) {
      toast.error(err.response?.data?.error || (isAr ? 'فشل النشر' : 'Publish failed'));
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <div className="page-header">
        <h1>📤 {isAr ? 'النشر في الصفحات' : 'Publish to Pages'}</h1>
        <p style={{ color: '#64748b' }}>{isAr ? 'نشر محتوى في صفحات المستخدمين' : 'Publish content to user pages'}</p>
      </div>

      <div className="card">
        <form onSubmit={handlePublish}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#94a3b8' }}>{isAr ? 'المحتوى' : 'Content'}</label>
            <textarea className="input" rows={5} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder={isAr ? 'اكتب نص المنشور...' : 'Write post content...'} required />
          </div>

          <div className="grid grid-2" style={{ marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#94a3b8' }}>{isAr ? 'صورة (اختياري)' : 'Image (optional)'}</label>
              <input type="file" accept="image/*" onChange={e => setImage(e.target.files[0])} style={{ fontSize: 12, color: '#94a3b8' }} />
              {!image && (
                <>
                  <label style={{ display: 'block', marginTop: 8, marginBottom: 6, fontSize: 12, color: '#64748b' }}>{isAr ? 'أو رابط صورة' : 'Or image URL'}</label>
                  <input className="input" value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
                </>
              )}
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#94a3b8' }}>{isAr ? 'المنصة' : 'Platform'}</label>
              <select className="input" value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })}>
                <option value="">{isAr ? 'كل المنصات' : 'All Platforms'}</option>
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
                <option value="telegram">Telegram</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <label className="switch">
                <input type="checkbox" checked={form.allUsers} onChange={e => setForm({ ...form, allUsers: e.target.checked })} />
                <span className="slider"></span>
              </label>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{isAr ? 'نشر لجميع المستخدمين' : 'Publish to all users'}</span>
            </div>
            {!form.allUsers && (
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#94a3b8' }}>{isAr ? 'اختر المستخدمين' : 'Select users'}</label>
                <div style={{ maxHeight: 200, overflow: 'auto', background: '#0f172a', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {users.map(u => (
                    <label key={u._id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                      <input type="checkbox" checked={form.userIds.includes(u._id)} onChange={e => {
                        setForm(prev => ({
                          ...prev, userIds: e.target.checked
                            ? [...prev.userIds, u._id]
                            : prev.userIds.filter(id => id !== u._id)
                        }));
                      }} />
                      {u.name} <span style={{ color: '#64748b' }}>({u.email})</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {result && (
            <div style={{ padding: 16, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
              ✓ {isAr ? `تم النشر في ${result.published} صفحة` : `Published to ${result.published} pages`}
              {result.failed > 0 && `, ${isAr ? 'فشل في' : 'failed:'} ${result.failed}`}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={publishing}>
            {publishing ? (isAr ? 'جاري النشر...' : 'Publishing...') : (isAr ? '📤 نشر الآن' : '📤 Publish Now')}
          </button>
        </form>
      </div>
    </div>
  );
}
