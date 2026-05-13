import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = process.env.REACT_APP_API_URL || '/api';

const CATEGORY_COLORS = {
  ecommerce:'#6366f1', service:'#8b5cf6', engagement:'#06b6d4',
  leadgen:'#10b981', support:'#f59e0b', announcement:'#ef4444', custom:'#64748b'
};

export default function AdminTemplates() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name:'', nameAr:'', description:'', descriptionAr:'',
    category:'engagement', platform:'all', type:'comment_reply', icon:'🤖',
    isPremium:false,
    config:{ useAI:false, aiPrompt:'', allPosts:true, triggers:[], actions:[{ type:'comment', message:'', messageAr:'', delay:0 }] }
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios.get(`${API}/templates`).then(r => setTemplates(r.data)).finally(() => setLoading(false));
  }, []);

  const openCreate = () => { setEditing(null); setForm({ name:'', nameAr:'', description:'', descriptionAr:'', category:'engagement', platform:'all', type:'comment_reply', icon:'🤖', isPremium:false, config:{ useAI:false, aiPrompt:'', allPosts:true, triggers:[], actions:[{ type:'comment', message:'', messageAr:'', delay:0 }] } }); setShowModal(true); };
  const openEdit = (tpl) => { setEditing(tpl); setForm({ ...tpl }); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let res;
      if (editing) {
        res = await axios.put(`${API}/templates/${editing._id}`, form);
        setTemplates(prev => prev.map(t => t._id===editing._id ? res.data : t));
        toast.success(isAr?'تم التحديث':'Updated');
      } else {
        res = await axios.post(`${API}/templates`, form);
        setTemplates(prev => [res.data, ...prev]);
        toast.success(isAr?'تم الإنشاء':'Created');
      }
      setShowModal(false);
    } catch (err) { toast.error(err.response?.data?.error||'Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(isAr?'حذف هذا القالب؟':'Delete this template?')) return;
    await axios.delete(`${API}/templates/${id}`);
    setTemplates(prev => prev.filter(t=>t._id!==id));
    toast.success(isAr?'تم الحذف':'Deleted');
  };

  if (loading) return <div style={{ padding:60, textAlign:'center', color:'#64748b' }}>...</div>;

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1>📋 {isAr?'إدارة القوالب':'Template Management'}</h1>
          <p style={{ color:'#64748b' }}>{templates.length} {isAr?'قالب':'templates'}</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary">+ {isAr?'قالب جديد':'New Template'}</button>
      </div>

      <div className="grid grid-3">
        {templates.map(tpl => (
          <div key={tpl._id} className="card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
              <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                <span style={{ fontSize:28 }}>{tpl.icon}</span>
                <div>
                  <p style={{ fontWeight:700, fontSize:14 }}>{isAr && tpl.nameAr ? tpl.nameAr : tpl.name}</p>
                  <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginTop:3 }}>
                    <span className="badge" style={{ background:`${CATEGORY_COLORS[tpl.category]}22`, color:CATEGORY_COLORS[tpl.category], fontSize:10 }}>{tpl.category}</span>
                    {tpl.isPremium && <span className="badge" style={{ background:'rgba(245,158,11,0.15)', color:'#f59e0b', fontSize:10 }}>PRO</span>}
                    {tpl.isBuiltIn && <span className="badge" style={{ background:'rgba(99,102,241,0.1)', color:'#818cf8', fontSize:10 }}>{isAr?'مدمج':'Built-in'}</span>}
                  </div>
                </div>
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={() => openEdit(tpl)} className="btn btn-sm btn-outline">✏️</button>
                {!tpl.isBuiltIn && <button onClick={() => handleDelete(tpl._id)} className="btn btn-sm btn-danger">✕</button>}
              </div>
            </div>
            <p style={{ fontSize:12, color:'#94a3b8', marginBottom:8 }}>
              {isAr && tpl.descriptionAr ? tpl.descriptionAr : tpl.description}
            </p>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#475569', paddingTop:8, borderTop:'1px solid #334155' }}>
              <span>{tpl.platform} • {tpl.type}</span>
              <span>👥 {tpl.usageCount} {isAr?'استخدام':'uses'}</span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{ maxWidth:620 }}>
            <h3 className="modal-title">{editing ? (isAr?'تعديل القالب':'Edit Template') : (isAr?'قالب جديد':'New Template')}</h3>
            <form onSubmit={handleSave}>
              <div className="grid grid-2" style={{ marginBottom:12 }}>
                <div>
                  <label style={{ display:'block', marginBottom:5, fontSize:12, color:'#94a3b8' }}>{isAr?'الاسم (عربي)':'Name (AR)'}</label>
                  <input className="input" value={form.nameAr} onChange={e=>setForm({...form,nameAr:e.target.value,name:form.name||e.target.value})} required />
                </div>
                <div>
                  <label style={{ display:'block', marginBottom:5, fontSize:12, color:'#94a3b8' }}>Name (EN)</label>
                  <input className="input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
                </div>
              </div>
              <div className="grid grid-2" style={{ marginBottom:12 }}>
                <div>
                  <label style={{ display:'block', marginBottom:5, fontSize:12, color:'#94a3b8' }}>{isAr?'الوصف (عربي)':'Desc (AR)'}</label>
                  <textarea className="input" rows={2} value={form.descriptionAr} onChange={e=>setForm({...form,descriptionAr:e.target.value,description:form.description||e.target.value})} />
                </div>
                <div>
                  <label style={{ display:'block', marginBottom:5, fontSize:12, color:'#94a3b8' }}>Desc (EN)</label>
                  <textarea className="input" rows={2} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
                </div>
              </div>
              <div className="grid grid-4" style={{ marginBottom:12 }}>
                <div>
                  <label style={{ display:'block', marginBottom:5, fontSize:12, color:'#94a3b8' }}>{isAr?'الأيقونة':'Icon'}</label>
                  <input className="input" value={form.icon} onChange={e=>setForm({...form,icon:e.target.value})} style={{ textAlign:'center', fontSize:20 }} />
                </div>
                <div>
                  <label style={{ display:'block', marginBottom:5, fontSize:12, color:'#94a3b8' }}>{isAr?'الفئة':'Category'}</label>
                  <select className="input" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                    {['ecommerce','service','engagement','leadgen','support','announcement','custom'].map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display:'block', marginBottom:5, fontSize:12, color:'#94a3b8' }}>{isAr?'المنصة':'Platform'}</label>
                  <select className="input" value={form.platform} onChange={e=>setForm({...form,platform:e.target.value})}>
                    {['all','facebook','instagram','whatsapp','telegram','tiktok'].map(p=><option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display:'block', marginBottom:5, fontSize:12, color:'#94a3b8' }}>{isAr?'النوع':'Type'}</label>
                  <select className="input" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
                    {['comment_reply','dm_reply','post_dm','keyword','ai','sequence'].map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display:'flex', gap:16, marginBottom:12, alignItems:'center' }}>
                <label style={{ display:'flex', gap:8, alignItems:'center', cursor:'pointer', fontSize:13 }}>
                  <label className="switch"><input type="checkbox" checked={form.isPremium} onChange={e=>setForm({...form,isPremium:e.target.checked})} /><span className="slider"></span></label>
                  PRO Only
                </label>
                <label style={{ display:'flex', gap:8, alignItems:'center', cursor:'pointer', fontSize:13 }}>
                  <label className="switch"><input type="checkbox" checked={form.config?.useAI} onChange={e=>setForm(prev=>({...prev,config:{...prev.config,useAI:e.target.checked}}))} /><span className="slider"></span></label>
                  AI Bot
                </label>
              </div>
              {/* Actions */}
              <div style={{ marginBottom:12 }}>
                <label style={{ display:'block', marginBottom:8, fontSize:12, color:'#94a3b8' }}>{isAr?'إجراء البوت':'Bot Action'}</label>
                {(form.config?.actions||[]).map((a,i) => (
                  <div key={i} style={{ background:'#0f172a', borderRadius:10, padding:12, marginBottom:8 }}>
                    <div className="grid grid-2" style={{ marginBottom:8 }}>
                      <div>
                        <select className="input" value={a.type} onChange={e => { const ac=[...form.config.actions]; ac[i].type=e.target.value; setForm(prev=>({...prev,config:{...prev.config,actions:ac}})); }}>
                          <option value="comment">comment</option>
                          <option value="dm">dm</option>
                        </select>
                      </div>
                      <div>
                        <input className="input" type="number" min="0" value={a.delay||0} placeholder="Delay (s)" onChange={e => { const ac=[...form.config.actions]; ac[i].delay=Number(e.target.value); setForm(prev=>({...prev,config:{...prev.config,actions:ac}})); }} />
                      </div>
                    </div>
                    <textarea className="input" rows={2} placeholder={isAr?'نص الرسالة (عربي)':'Message (AR)'} value={a.messageAr||''} onChange={e=>{const ac=[...form.config.actions];ac[i].messageAr=e.target.value;setForm(prev=>({...prev,config:{...prev.config,actions:ac}}))}} style={{ marginBottom:6 }} />
                    <textarea className="input" rows={2} placeholder="Message (EN)" value={a.message||''} onChange={e=>{const ac=[...form.config.actions];ac[i].message=e.target.value;setForm(prev=>({...prev,config:{...prev.config,actions:ac}}))}} />
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">{isAr?'إلغاء':'Cancel'}</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving?'...':(isAr?'حفظ':'Save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
