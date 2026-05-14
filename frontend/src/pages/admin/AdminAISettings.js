import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = process.env.REACT_APP_API_URL || '/api';

const PROVIDERS = [
  { id:'openai',    label:'OpenAI',       icon:'🟢', models:['gpt-4o','gpt-4o-mini','gpt-4-turbo','gpt-3.5-turbo'], baseUrl:'https://api.openai.com/v1' },
  { id:'deepseek',  label:'DeepSeek',     icon:'🔵', models:['deepseek-chat','deepseek-reasoner'], baseUrl:'https://api.deepseek.com/v1' },
  { id:'gemini',    label:'Google Gemini', icon:'🟡', models:['gemini-1.5-pro','gemini-1.5-flash','gemini-pro'], baseUrl:'https://generativelanguage.googleapis.com/v1beta/openai' },
  { id:'anthropic', label:'Claude',       icon:'🟠', models:['claude-3-5-sonnet-20241022','claude-3-5-haiku-20241022'], baseUrl:'https://api.anthropic.com/v1' },
  { id:'custom',    label:'Custom',       icon:'⚙️', models:[], baseUrl:'' },
];

const emptyModel = { name:'', provider:'openai', apiKey:'', baseUrl:'https://api.openai.com/v1', model:'gpt-3.5-turbo', temperature:0.7, maxTokens:300, systemPrompt:'', replyLanguage:'auto', isDefault:false, isEnabled:true };

export default function AdminAISettings() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [cfg, setCfg]           = useState(null);
  const [showAdd, setShowAdd]   = useState(false);
  const [editId, setEditId]     = useState(null);
  const [form, setForm]         = useState({ ...emptyModel });
  const [saving, setSaving]     = useState(false);
  const [testing, setTesting]   = useState(null);
  const [showKey, setShowKey]   = useState({});

  useEffect(() => { loadCfg(); }, []);

  const loadCfg = () => axios.get(`${API}/ai-settings`).then(r => setCfg(r.data)).catch(() => {});

  const toggleGlobal = async (val) => {
    try {
      const r = await axios.put(`${API}/ai-settings`, { globalEnabled: val });
      setCfg(r.data);
      toast.success(val ? (isAr?'✅ تم تفعيل AI':'✅ AI Enabled') : (isAr?'⛔ تم تعطيل AI':'⛔ AI Disabled'));
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const openAdd = () => { setEditId(null); setForm({ ...emptyModel }); setShowAdd(true); };
  const openEdit = (m) => { setEditId(m._id); setForm({ ...m }); setShowAdd(true); };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error(isAr?'أدخل اسم النموذج':'Enter model name');
    setSaving(true);
    try {
      if (editId) {
        const r = await axios.put(`${API}/ai-settings/models/${editId}`, form);
        setCfg(r.data);
        toast.success(isAr?'✅ تم التحديث':'✅ Updated');
      } else {
        const r = await axios.post(`${API}/ai-settings/models`, form);
        setCfg(r.data);
        toast.success(isAr?'✅ تم الإضافة':'✅ Added');
      }
      setShowAdd(false);
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(isAr?'حذف هذا النموذج؟':'Delete this model?')) return;
    try {
      const r = await axios.delete(`${API}/ai-settings/models/${id}`);
      setCfg(r.data);
      toast.success(isAr?'تم الحذف':'Deleted');
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const handleSetDefault = async (id) => {
    try {
      const r = await axios.put(`${API}/ai-settings/models/${id}`, { isDefault: true });
      setCfg(r.data);
      toast.success(isAr?'✅ تم التعيين كافتراضي':'✅ Set as default');
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const handleTest = async (id) => {
    setTesting(id);
    try {
      const r = await axios.post(`${API}/ai-settings/test/${id}`);
      toast.success(`✅ ${r.data.name}: "${r.data.reply}"`);
      loadCfg();
    } catch (err) {
      toast.error(`❌ ${err.response?.data?.error || err.message}`);
    } finally { setTesting(null); }
  };

  if (!cfg) return <div style={{ padding:60, textAlign:'center', color:'#64748b' }}><p style={{ fontSize:40 }}>🧠</p><p>{isAr?'جاري التحميل...':'Loading...'}</p></div>;

  const provider = PROVIDERS.find(p => p.id === form.provider) || PROVIDERS[0];

  return (
    <div style={{ maxWidth:860 }}>
      {/* Header */}
      <div className="page-header flex-between">
        <div>
          <h1>🧠 {isAr?'إعدادات الذكاء الاصطناعي':'AI Settings'}</h1>
          <p style={{ color:'#64748b', marginTop:4 }}>{isAr?'أضف نماذج AI متعددة للرد التلقائي على التعليقات والرسائل':'Add multiple AI models for auto-replies to comments and messages'}</p>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer',
            background:cfg.globalEnabled?'rgba(16,185,129,0.1)':'rgba(255,255,255,0.03)',
            border:`1px solid ${cfg.globalEnabled?'rgba(16,185,129,0.4)':'#334155'}`,
            borderRadius:10, padding:'6px 14px' }}>
            <label className="switch" style={{ width:38, height:22 }}>
              <input type="checkbox" checked={cfg.globalEnabled} onChange={e=>toggleGlobal(e.target.checked)} />
              <span className="slider" style={{ borderRadius:22 }}></span>
            </label>
            <span style={{ fontSize:13, fontWeight:600, color:cfg.globalEnabled?'#10b981':'#64748b' }}>
              {cfg.globalEnabled?(isAr?'AI مفعّل':'AI Enabled'):(isAr?'AI معطّل':'AI Disabled')}
            </span>
          </label>
          <button onClick={openAdd} className="btn btn-primary">+ {isAr?'نموذج جديد':'New Model'}</button>
        </div>
      </div>

      {/* Test banner */}
      {cfg.lastTest && cfg.lastTest.status !== 'untested' && (
        <div style={{ padding:'10px 16px', borderRadius:10, marginBottom:16, fontSize:13,
          background:cfg.lastTest.status==='success'?'rgba(16,185,129,0.08)':'rgba(239,68,68,0.08)',
          border:`1px solid ${cfg.lastTest.status==='success'?'rgba(16,185,129,0.25)':'rgba(239,68,68,0.25)'}`,
          color:cfg.lastTest.status==='success'?'#10b981':'#ef4444' }}>
          {cfg.lastTest.status==='success'?'✅':'❌'} {cfg.lastTest.modelName}: {cfg.lastTest.message}
          <span style={{ color:'#475569', marginRight:8, marginLeft:8, fontSize:11 }}>
            {cfg.lastTest.testedAt && new Date(cfg.lastTest.testedAt).toLocaleString(isAr?'ar':'en')}
          </span>
        </div>
      )}

      {/* Models list */}
      {(cfg.models||[]).length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px', border:'1px dashed #334155', borderRadius:16, color:'#475569' }}>
          <p style={{ fontSize:44, marginBottom:12 }}>🧠</p>
          <p style={{ fontSize:16, marginBottom:8 }}>{isAr?'لا توجد نماذج بعد':'No models yet'}</p>
          <p style={{ fontSize:13, marginBottom:20 }}>{isAr?'أضف نموذج AI أول للبدء بالردود التلقائية':'Add your first AI model to start auto-replying'}</p>
          <button onClick={openAdd} className="btn btn-primary">+ {isAr?'إضافة نموذج':'Add Model'}</button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {cfg.models.map(m => {
            const prov = PROVIDERS.find(p=>p.id===m.provider) || PROVIDERS[4];
            return (
              <div key={m._id} className="card" style={{ opacity:m.isEnabled?1:0.55, border:m.isDefault?'1px solid rgba(99,102,241,0.5)':'1px solid #334155' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                    <div style={{ fontSize:28 }}>{prov.icon}</div>
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontWeight:700, fontSize:16 }}>{m.name}</span>
                        {m.isDefault && <span className="badge badge-primary" style={{ fontSize:10 }}>{isAr?'افتراضي':'Default'}</span>}
                        {!m.isEnabled && <span className="badge badge-danger" style={{ fontSize:10 }}>{isAr?'معطّل':'Disabled'}</span>}
                      </div>
                      <p style={{ fontSize:12, color:'#64748b', marginTop:2 }}>
                        {prov.label} • <code style={{ color:'#818cf8' }}>{m.model}</code> • temp:{m.temperature} • max:{m.maxTokens}
                      </p>
                      {m.systemPrompt && <p style={{ fontSize:11, color:'#475569', marginTop:3, maxWidth:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>📝 {m.systemPrompt.slice(0,80)}...</p>}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:6, alignItems:'center', flexShrink:0 }}>
                    <button onClick={()=>handleTest(m._id)} className="btn btn-sm btn-outline" disabled={testing===m._id}>
                      {testing===m._id?'⏳':'🔌'} {isAr?'اختبار':'Test'}
                    </button>
                    {!m.isDefault && <button onClick={()=>handleSetDefault(m._id)} className="btn btn-sm btn-outline" title={isAr?'تعيين كافتراضي':'Set default'}>⭐</button>}
                    <button onClick={()=>openEdit(m)} className="btn btn-sm btn-outline">✏️</button>
                    <button onClick={()=>handleDelete(m._id)} className="btn btn-sm btn-danger">✕</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info */}
      <div className="card" style={{ marginTop:20, background:'rgba(99,102,241,0.04)', border:'1px solid rgba(99,102,241,0.15)' }}>
        <h3 style={{ fontSize:14, fontWeight:600, marginBottom:8 }}>💡 {isAr?'كيف يعمل؟':'How it works?'}</h3>
        <ul style={{ fontSize:13, color:'#94a3b8', lineHeight:2.2, paddingInlineStart:18 }}>
          <li>{isAr?'أضف نموذج أو أكثر (يمكنك تسمية كل نموذج)':'Add one or more models (you can name each one)'}</li>
          <li>{isAr?'النموذج الافتراضي يُستخدم لجميع البوتات التي تفعّل AI':'The default model is used for all bots with AI enabled'}</li>
          <li>{isAr?'يمكنك استخدام عدة مزودين مختلفين (OpenAI + DeepSeek + ...)':'You can mix providers (OpenAI + DeepSeek + ...)'}</li>
          <li>{isAr?'كل بوت يمكنه تجاوز System Prompt الخاص بالنموذج':'Each bot can override the model system prompt'}</li>
        </ul>
      </div>

      {/* Add/Edit Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={()=>setShowAdd(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{ maxWidth:600 }}>
            <h3 className="modal-title">{editId?(isAr?'✏️ تعديل النموذج':'✏️ Edit Model'):(isAr?'➕ نموذج جديد':'➕ New Model')}</h3>

            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', marginBottom:5, fontSize:13, color:'#94a3b8' }}>{isAr?'اسم النموذج (اختياري — للتمييز)':'Model Name (for your reference)'}</label>
              <input className="input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}
                placeholder={isAr?'مثال: GPT-4 لخدمة العملاء':'e.g. GPT-4 Customer Support'} />
            </div>

            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', marginBottom:5, fontSize:13, color:'#94a3b8' }}>{isAr?'المزود':'Provider'}</label>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8 }}>
                {PROVIDERS.map(p=>(
                  <div key={p.id} onClick={()=>setForm({...form,provider:p.id,baseUrl:p.baseUrl,model:p.models[0]||form.model})}
                    style={{ padding:'10px 6px', borderRadius:10, textAlign:'center', cursor:'pointer',
                      border:`2px solid ${form.provider===p.id?'#6366f1':'#334155'}`,
                      background:form.provider===p.id?'rgba(99,102,241,0.1)':'transparent' }}>
                    <div style={{ fontSize:18 }}>{p.icon}</div>
                    <div style={{ fontSize:11, color:form.provider===p.id?'#818cf8':'#64748b', marginTop:3 }}>{p.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-2" style={{ marginBottom:14 }}>
              <div>
                <label style={{ display:'block', marginBottom:5, fontSize:13, color:'#94a3b8' }}>{isAr?'مفتاح API':'API Key'}</label>
                <div style={{ position:'relative' }}>
                  <input className="input" type={showKey[editId||'new']?'text':'password'} value={form.apiKey}
                    onChange={e=>setForm({...form,apiKey:e.target.value})} placeholder={isAr?'مفتاح API':'API Key'} style={{ paddingRight:36 }} />
                  <button onClick={()=>setShowKey(p=>({...p,[editId||'new']:!p[editId||'new']}))}
                    style={{ position:'absolute', top:'50%', right:10, transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#64748b' }}>
                    {showKey[editId||'new']?'🙈':'👁️'}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ display:'block', marginBottom:5, fontSize:13, color:'#94a3b8' }}>Base URL</label>
                <input className="input" value={form.baseUrl} onChange={e=>setForm({...form,baseUrl:e.target.value})} placeholder="https://api.openai.com/v1" />
              </div>
            </div>

            <div className="grid grid-2" style={{ marginBottom:14 }}>
              <div>
                <label style={{ display:'block', marginBottom:5, fontSize:13, color:'#94a3b8' }}>{isAr?'النموذج':'Model'}</label>
                {provider.models.length > 0 ? (
                  <select className="input" value={provider.models.includes(form.model)?form.model:'_custom'}
                    onChange={e=>{ if(e.target.value==='_custom') return; setForm({...form,model:e.target.value}); }}>
                    {provider.models.map(m=><option key={m} value={m}>{m}</option>)}
                    <option value="_custom">{isAr?'— يدوي —':'— Custom —'}</option>
                  </select>
                ) : null}
                {(!provider.models.includes(form.model) || form.provider==='custom') && (
                  <input className="input" style={{ marginTop:provider.models.length?6:0 }} value={form.model}
                    onChange={e=>setForm({...form,model:e.target.value})} placeholder={isAr?'اسم النموذج':'Model name'} />
                )}
              </div>
              <div>
                <label style={{ display:'block', marginBottom:5, fontSize:13, color:'#94a3b8' }}>{isAr?'لغة الرد':'Reply Language'}</label>
                <select className="input" value={form.replyLanguage} onChange={e=>setForm({...form,replyLanguage:e.target.value})}>
                  <option value="auto">{isAr?'تلقائي':'Auto'}</option>
                  <option value="ar">🇸🇦 {isAr?'عربي':'Arabic'}</option>
                  <option value="en">🇺🇸 {isAr?'إنجليزي':'English'}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-2" style={{ marginBottom:14 }}>
              <div>
                <label style={{ display:'block', marginBottom:5, fontSize:13, color:'#94a3b8' }}>Temperature: {form.temperature}</label>
                <input type="range" min="0" max="2" step="0.05" value={form.temperature}
                  onChange={e=>setForm({...form,temperature:parseFloat(e.target.value)})} style={{ width:'100%', accentColor:'#6366f1' }} />
              </div>
              <div>
                <label style={{ display:'block', marginBottom:5, fontSize:13, color:'#94a3b8' }}>Max Tokens: {form.maxTokens}</label>
                <input type="range" min="50" max="2000" step="50" value={form.maxTokens}
                  onChange={e=>setForm({...form,maxTokens:parseInt(e.target.value)})} style={{ width:'100%', accentColor:'#6366f1' }} />
              </div>
            </div>

            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', marginBottom:5, fontSize:13, color:'#94a3b8' }}>📝 {isAr?'تعليمات النظام (System Prompt)':'System Prompt'}</label>
              <textarea className="input" rows={3} value={form.systemPrompt}
                onChange={e=>setForm({...form,systemPrompt:e.target.value})}
                placeholder={isAr?'مثال: أنت مساعد خدمة عملاء ودود...':'e.g. You are a friendly support agent...'} />
            </div>

            <div style={{ display:'flex', gap:16, alignItems:'center', marginBottom:20 }}>
              <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontSize:13 }}>
                <input type="checkbox" checked={form.isDefault} onChange={e=>setForm({...form,isDefault:e.target.checked})} />
                ⭐ {isAr?'افتراضي':'Default'}
              </label>
              <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontSize:13 }}>
                <input type="checkbox" checked={form.isEnabled} onChange={e=>setForm({...form,isEnabled:e.target.checked})} />
                ✅ {isAr?'مفعّل':'Enabled'}
              </label>
            </div>

            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={()=>setShowAdd(false)} className="btn btn-outline">{isAr?'إلغاء':'Cancel'}</button>
              <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
                {saving?'⏳':(editId?(isAr?'💾 تحديث':'💾 Update'):(isAr?'➕ إضافة':'➕ Add')))}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
