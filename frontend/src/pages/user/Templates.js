import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = process.env.REACT_APP_API_URL || '/api';

const CATEGORY_COLORS = {
  ecommerce:'#6366f1', service:'#8b5cf6', engagement:'#06b6d4',
  leadgen:'#10b981', support:'#f59e0b', announcement:'#ef4444', custom:'#64748b'
};

const CATEGORIES_AR = {
  ecommerce:'تجارة إلكترونية', service:'خدمات', engagement:'تفاعل',
  leadgen:'جذب عملاء', support:'دعم', announcement:'إعلانات', custom:'مخصص', all:'الكل'
};

export default function Templates() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [useModal, setUseModal] = useState(null);
  const [useForm, setUseForm] = useState({ name:'', pageId:'' });
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/templates${category ? `?category=${category}` : ''}`).then(r => setTemplates(r.data)),
      axios.get(`${API}/pages`).then(r => setPages(r.data)),
    ]).finally(() => setLoading(false));
  }, [category]);

  const handleUse = async (e) => {
    e.preventDefault();
    setApplying(true);
    try {
      const res = await axios.post(`${API}/templates/${useModal._id}/use`, {
        name: useForm.name || useModal.name,
        pageId: useForm.pageId || undefined
      });
      toast.success(isAr?`تم إنشاء بوت "${res.data.name}" بنجاح!`:`Bot "${res.data.name}" created!`);
      setUseModal(null);
      navigate('/dashboard/bots');
    } catch (err) { toast.error(err.response?.data?.error||'Error'); }
    finally { setApplying(false); }
  };

  if (loading) return <div style={{ padding:60, textAlign:'center', color:'#64748b' }}>...</div>;

  const cats = ['','ecommerce','service','engagement','leadgen','support','announcement'];

  return (
    <div>
      <div className="page-header">
        <h1>📋 {isAr?'قوالب البوتات':'Bot Templates'}</h1>
        <p style={{ color:'#64748b' }}>{isAr?'ابدأ بسرعة باستخدام قوالب جاهزة':'Start quickly with ready-made templates'}</p>
      </div>

      {/* Category filter */}
      <div style={{ display:'flex', gap:8, marginBottom:24, flexWrap:'wrap' }}>
        {cats.map(c => (
          <button key={c} onClick={() => setCategory(c)} className={`btn btn-sm ${category===c?'btn-primary':'btn-outline'}`}>
            {c ? (isAr ? CATEGORIES_AR[c] : c) : (isAr?'الكل':'All')}
          </button>
        ))}
      </div>

      <div className="grid grid-3">
        {templates.map(tpl => (
          <div key={tpl._id} className="card" style={{ cursor:'default', position:'relative', overflow:'visible' }}>
            {tpl.isPremium && (
              <div style={{ position:'absolute', top:-8, right:-8, background:'linear-gradient(135deg,#f59e0b,#d97706)', color:'white', borderRadius:8, padding:'3px 10px', fontSize:11, fontWeight:700 }}>
                PRO
              </div>
            )}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
              <div style={{ fontSize:32 }}>{tpl.icon}</div>
              <span className="badge" style={{ background:`${CATEGORY_COLORS[tpl.category]}22`, color:CATEGORY_COLORS[tpl.category], fontSize:10 }}>
                {isAr ? CATEGORIES_AR[tpl.category] : tpl.category}
              </span>
            </div>
            <h3 style={{ fontSize:15, fontWeight:700, marginBottom:6 }}>{isAr && tpl.nameAr ? tpl.nameAr : tpl.name}</h3>
            <p style={{ fontSize:12, color:'#94a3b8', lineHeight:1.6, marginBottom:14 }}>
              {isAr && tpl.descriptionAr ? tpl.descriptionAr : tpl.description}
            </p>
            <div style={{ display:'flex', gap:6, marginBottom:14, flexWrap:'wrap' }}>
              <span className="badge badge-primary" style={{ fontSize:10 }}>{tpl.platform}</span>
              <span className="badge" style={{ background:'#334155', color:'#94a3b8', fontSize:10 }}>{tpl.type}</span>
              {tpl.config?.useAI && <span className="badge" style={{ background:'rgba(139,92,246,0.15)', color:'#8b5cf6', fontSize:10 }}>🧠 AI</span>}
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:12, borderTop:'1px solid #334155' }}>
              <span style={{ fontSize:11, color:'#475569' }}>👥 {tpl.usageCount} {isAr?'استخدام':'uses'}</span>
              <button
                onClick={() => { setUseModal(tpl); setUseForm({ name: isAr && tpl.nameAr ? tpl.nameAr : tpl.name, pageId:'' }); }}
                className="btn btn-primary btn-sm"
              >
                {isAr?'استخدام':'Use Template'}
              </button>
            </div>
          </div>
        ))}
        {templates.length === 0 && (
          <div style={{ gridColumn:'1/-1', textAlign:'center', padding:60, color:'#64748b' }}>
            <p style={{ fontSize:40, marginBottom:12 }}>📋</p>
            <p>{isAr?'لا توجد قوالب في هذه الفئة':'No templates in this category'}</p>
          </div>
        )}
      </div>

      {/* Use Template Modal */}
      {useModal && (
        <div className="modal-overlay" onClick={() => setUseModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{ maxWidth:420 }}>
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <div style={{ fontSize:44, marginBottom:8 }}>{useModal.icon}</div>
              <h3 style={{ fontSize:16, fontWeight:700 }}>{isAr && useModal.nameAr ? useModal.nameAr : useModal.name}</h3>
              <p style={{ fontSize:13, color:'#64748b', marginTop:4 }}>{isAr && useModal.descriptionAr ? useModal.descriptionAr : useModal.description}</p>
            </div>
            <form onSubmit={handleUse}>
              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', marginBottom:6, fontSize:13, color:'#94a3b8' }}>{isAr?'اسم البوت':'Bot Name'}</label>
                <input className="input" value={useForm.name} onChange={e=>setUseForm({...useForm,name:e.target.value})} required />
              </div>
              <div style={{ marginBottom:20 }}>
                <label style={{ display:'block', marginBottom:6, fontSize:13, color:'#94a3b8' }}>{isAr?'الصفحة (اختياري)':'Page (optional)'}</label>
                <select className="input" value={useForm.pageId} onChange={e=>setUseForm({...useForm,pageId:e.target.value})}>
                  <option value="">{isAr?'كل الصفحات':'All pages'}</option>
                  {pages.filter(p => useModal.platform === 'all' || p.platform === useModal.platform).map(p => (
                    <option key={p._id} value={p._id}>{p.pageName} ({p.platform})</option>
                  ))}
                </select>
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button type="button" onClick={() => setUseModal(null)} className="btn btn-outline">{isAr?'إلغاء':'Cancel'}</button>
                <button type="submit" className="btn btn-primary" disabled={applying}>{applying?'...':(isAr?'إنشاء البوت':'Create Bot')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
