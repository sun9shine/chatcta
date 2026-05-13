import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = process.env.REACT_APP_API_URL || '/api';
const STATUS_COLOR = { pending:'#f59e0b', published:'#10b981', failed:'#ef4444', cancelled:'#64748b' };

export default function ScheduledPosts() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [posts, setPosts] = useState([]);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    content:'', imageUrl:'', scheduledAt:'', timezone:'UTC',
    pageIds:[], repeat:{ enabled:false, interval:'daily' }
  });
  const [image, setImage] = useState(null);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/scheduled?status=${filter}`).then(r => setPosts(r.data)),
      axios.get(`${API}/pages`).then(r => setPages(r.data)),
    ]).finally(() => setLoading(false));
  }, [filter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.content.trim()) return toast.error(isAr?'اكتب المحتوى':'Enter content');
    if (!form.scheduledAt) return toast.error(isAr?'حدد وقت النشر':'Select publish time');
    if (form.pageIds.length === 0) return toast.error(isAr?'اختر صفحة':'Select a page');
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('content', form.content);
      formData.append('scheduledAt', form.scheduledAt);
      formData.append('timezone', form.timezone);
      formData.append('pageIds', JSON.stringify(form.pageIds));
      formData.append('repeat', JSON.stringify(form.repeat));
      if (form.imageUrl) formData.append('imageUrl', form.imageUrl);
      if (image) formData.append('image', image);
      const res = await axios.post(`${API}/scheduled`, formData, { headers:{'Content-Type':'multipart/form-data'} });
      setPosts(p => filter === 'pending' ? [res.data, ...p] : p);
      setShowModal(false);
      setForm({ content:'', imageUrl:'', scheduledAt:'', timezone:'UTC', pageIds:[], repeat:{ enabled:false, interval:'daily' } });
      setImage(null);
      toast.success(isAr?'تم جدولة المنشور':'Post scheduled');
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
    finally { setSaving(false); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm(isAr?'إلغاء هذا المنشور؟':'Cancel this post?')) return;
    await axios.delete(`${API}/scheduled/${id}`);
    setPosts(p => p.filter(x => x._id !== id));
    toast.success(isAr?'تم الإلغاء':'Cancelled');
  };

  if (loading) return <div style={{ padding:60, textAlign:'center', color:'#64748b' }}>...</div>;

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1>📅 {isAr?'جدولة المنشورات':'Scheduled Posts'}</h1>
          <p style={{ color:'#64748b' }}>{isAr?'انشر محتواك في الوقت المناسب':'Publish your content at the right time'}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">+ {isAr?'منشور مجدول':'Schedule Post'}</button>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        {['pending','published','failed','cancelled'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`btn btn-sm ${filter===s?'btn-primary':'btn-outline'}`}>
            <span style={{ color:STATUS_COLOR[s] }}>●</span> {s}
          </button>
        ))}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {posts.map(post => (
          <div key={post._id} className="card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:14, lineHeight:1.6, marginBottom:8 }}>{post.content.slice(0,200)}{post.content.length>200?'...':''}</p>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
                  <span style={{ fontSize:12, background:'rgba(255,255,255,0.05)', padding:'3px 10px', borderRadius:6, color:'#94a3b8' }}>
                    📅 {new Date(post.scheduledAt).toLocaleString(isAr?'ar':'en')}
                  </span>
                  <span className="badge" style={{ background:`${STATUS_COLOR[post.status]}22`, color:STATUS_COLOR[post.status] }}>{post.status}</span>
                  {post.repeat?.enabled && <span className="badge badge-primary">🔄 {post.repeat.interval}</span>}
                  {post.pageIds?.map(p => (
                    <span key={p._id||p} className="badge badge-primary" style={{ fontSize:11 }}>{p.pageName||p}</span>
                  ))}
                </div>
                {post.results?.length > 0 && (
                  <div style={{ marginTop:10, fontSize:12, color:'#64748b' }}>
                    ✓ {post.results.filter(r=>r.status==='success').length} {isAr?'نجح':'succeeded'} &nbsp;
                    {post.results.filter(r=>r.status==='failed').length > 0 && (
                      <span style={{ color:'#ef4444' }}>✕ {post.results.filter(r=>r.status==='failed').length} {isAr?'فشل':'failed'}</span>
                    )}
                  </div>
                )}
              </div>
              {post.imageUrl && (
                <img src={post.imageUrl} alt="" style={{ width:80, height:80, objectFit:'cover', borderRadius:10, flexShrink:0 }} />
              )}
              {post.status === 'pending' && (
                <button onClick={() => handleCancel(post._id)} className="btn btn-sm btn-danger" style={{ flexShrink:0 }}>✕</button>
              )}
            </div>
          </div>
        ))}
        {posts.length === 0 && (
          <div style={{ textAlign:'center', padding:60, color:'#64748b' }}>
            <p style={{ fontSize:40, marginBottom:12 }}>📅</p>
            <p>{isAr?`لا توجد منشورات بحالة "${filter}"`:`No ${filter} posts`}</p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth:560 }}>
            <h3 className="modal-title">📅 {isAr?'جدولة منشور جديد':'Schedule New Post'}</h3>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', marginBottom:6, fontSize:13, color:'#94a3b8' }}>{isAr?'المحتوى':'Content'}</label>
                <textarea className="input" rows={4} value={form.content} onChange={e=>setForm({...form,content:e.target.value})} required />
              </div>
              <div className="grid grid-2" style={{ marginBottom:14 }}>
                <div>
                  <label style={{ display:'block', marginBottom:6, fontSize:13, color:'#94a3b8' }}>{isAr?'وقت النشر':'Publish Time'}</label>
                  <input className="input" type="datetime-local" value={form.scheduledAt} onChange={e=>setForm({...form,scheduledAt:e.target.value})} required />
                </div>
                <div>
                  <label style={{ display:'block', marginBottom:6, fontSize:13, color:'#94a3b8' }}>{isAr?'المنطقة الزمنية':'Timezone'}</label>
                  <select className="input" value={form.timezone} onChange={e=>setForm({...form,timezone:e.target.value})}>
                    <option value="UTC">UTC</option>
                    <option value="Asia/Riyadh">Riyadh (GMT+3)</option>
                    <option value="Asia/Dubai">Dubai (GMT+4)</option>
                    <option value="America/New_York">New York</option>
                    <option value="Europe/London">London</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', marginBottom:6, fontSize:13, color:'#94a3b8' }}>{isAr?'الصفحات':'Pages'}</label>
                <div style={{ maxHeight:120, overflow:'auto', background:'#0f172a', borderRadius:10, padding:10, display:'flex', flexDirection:'column', gap:4 }}>
                  {pages.map(p => (
                    <label key={p._id} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13 }}>
                      <input type="checkbox" checked={form.pageIds.includes(p._id)} onChange={e => setForm(prev => ({ ...prev, pageIds: e.target.checked ? [...prev.pageIds, p._id] : prev.pageIds.filter(id=>id!==p._id) }))} />
                      {p.pageName} <span style={{ fontSize:11, color:'#64748b' }}>({p.platform})</span>
                    </label>
                  ))}
                  {pages.length === 0 && <p style={{ fontSize:12, color:'#64748b' }}>{isAr?'لا توجد صفحات مرتبطة':'No connected pages'}</p>}
                </div>
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', marginBottom:6, fontSize:13, color:'#94a3b8' }}>{isAr?'صورة (اختياري)':'Image (optional)'}</label>
                <input type="file" accept="image/*" onChange={e=>setImage(e.target.files[0])} style={{ fontSize:12, color:'#94a3b8' }} />
                {!image && <input className="input" placeholder="https://..." value={form.imageUrl} onChange={e=>setForm({...form,imageUrl:e.target.value})} style={{ marginTop:8 }} />}
              </div>
              <div style={{ marginBottom:14, display:'flex', alignItems:'center', gap:10 }}>
                <label className="switch">
                  <input type="checkbox" checked={form.repeat.enabled} onChange={e=>setForm(prev=>({...prev,repeat:{...prev.repeat,enabled:e.target.checked}}))} />
                  <span className="slider"></span>
                </label>
                <span style={{ fontSize:13 }}>🔄 {isAr?'تكرار تلقائي':'Repeat'}</span>
                {form.repeat.enabled && (
                  <select className="input" value={form.repeat.interval} onChange={e=>setForm(prev=>({...prev,repeat:{...prev.repeat,interval:e.target.value}}))} style={{ width:120 }}>
                    <option value="daily">{isAr?'يومياً':'Daily'}</option>
                    <option value="weekly">{isAr?'أسبوعياً':'Weekly'}</option>
                    <option value="monthly">{isAr?'شهرياً':'Monthly'}</option>
                  </select>
                )}
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">{isAr?'إلغاء':'Cancel'}</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving?'...':(isAr?'جدولة':'Schedule')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
