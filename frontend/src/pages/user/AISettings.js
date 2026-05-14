import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = process.env.REACT_APP_API_URL || '/api';

const PROVIDERS = [
  { id:'openai',    label:'OpenAI',       icon:'🟢', models:['gpt-4o','gpt-4o-mini','gpt-4-turbo','gpt-3.5-turbo'], baseUrl:'https://api.openai.com/v1', keyHint:'sk-...', docsUrl:'https://platform.openai.com/api-keys' },
  { id:'deepseek',  label:'DeepSeek',     icon:'🔵', models:['deepseek-chat','deepseek-reasoner'], baseUrl:'https://api.deepseek.com/v1', keyHint:'sk-...', docsUrl:'https://platform.deepseek.com' },
  { id:'gemini',    label:'Google Gemini', icon:'🟡', models:['gemini-1.5-pro','gemini-1.5-flash','gemini-pro'], baseUrl:'https://generativelanguage.googleapis.com/v1beta/openai', keyHint:'AIza...', docsUrl:'https://aistudio.google.com/apikey' },
  { id:'anthropic', label:'Claude',       icon:'🟠', models:['claude-3-5-sonnet-20241022','claude-3-5-haiku-20241022'], baseUrl:'https://api.anthropic.com/v1', keyHint:'sk-ant-...', docsUrl:'https://console.anthropic.com' },
  { id:'custom',    label:'Custom',       icon:'⚙️', models:[], baseUrl:'', keyHint:'your-api-key', docsUrl:'' },
];

export default function AISettings() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [cfg, setCfg]           = useState(null);
  const [saving, setSaving]     = useState(false);
  const [testing, setTesting]   = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showKey, setShowKey]   = useState(false);
  const [customModel, setCustomModel] = useState('');

  useEffect(() => {
    axios.get(`${API}/ai-settings`).then(r => {
      setCfg(r.data);
      const p = PROVIDERS.find(p => p.id === r.data.provider);
      if (p && !p.models.includes(r.data.model)) setCustomModel(r.data.model);
    }).catch(() => {});
  }, []);

  if (!cfg) return <div style={{ padding:60, textAlign:'center', color:'#64748b' }}><p style={{ fontSize:40 }}>🧠</p><p>{isAr?'جاري التحميل...':'Loading...'}</p></div>;

  const provider = PROVIDERS.find(p => p.id === cfg.provider) || PROVIDERS[0];
  const update = patch => setCfg(prev => ({ ...prev, ...patch }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...cfg };
      if (customModel && !provider.models.includes(cfg.model)) payload.model = customModel;
      const r = await axios.put(`${API}/ai-settings`, payload);
      setCfg(r.data);
      toast.success(isAr?'✅ تم الحفظ':'✅ Saved');
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
    finally { setSaving(false); }
  };

  const handleTest = async () => {
    setTesting(true); setTestResult(null);
    try {
      await handleSave();
      const r = await axios.post(`${API}/ai-settings/test`);
      setTestResult({ ok:true, msg:r.data.reply, model:r.data.model });
      toast.success(isAr?'✅ الاتصال ناجح!':'✅ Connected!');
    } catch (err) {
      setTestResult({ ok:false, msg:err.response?.data?.error||err.message });
      toast.error(isAr?'❌ فشل الاتصال':'❌ Failed');
    } finally { setTesting(false); }
  };

  return (
    <div style={{ maxWidth:760 }}>
      {/* Header */}
      <div className="page-header flex-between">
        <div>
          <h1>🧠 {isAr?'إعدادات الذكاء الاصطناعي':'AI Settings'}</h1>
          <p style={{ color:'#64748b', marginTop:4 }}>{isAr?'اضبط النموذج الذي يرد على التعليقات والرسائل تلقائياً':'Configure the AI model for auto-replies'}</p>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer',
            background:cfg.enabled?'rgba(16,185,129,0.1)':'rgba(255,255,255,0.03)',
            border:`1px solid ${cfg.enabled?'rgba(16,185,129,0.4)':'#334155'}`,
            borderRadius:10, padding:'6px 14px' }}>
            <label className="switch" style={{ width:38, height:22 }}>
              <input type="checkbox" checked={cfg.enabled} onChange={e=>update({enabled:e.target.checked})} />
              <span className="slider" style={{ borderRadius:22 }}></span>
            </label>
            <span style={{ fontSize:13, fontWeight:600, color:cfg.enabled?'#10b981':'#64748b' }}>
              {cfg.enabled?(isAr?'مفعّل':'Enabled'):(isAr?'معطّل':'Disabled')}
            </span>
          </label>
          <button onClick={handleTest} className="btn btn-outline" disabled={testing||saving}>
            {testing?'⏳':'🔌'} {isAr?'اختبار':'Test'}
          </button>
          <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
            {saving?'...':'💾'} {isAr?'حفظ':'Save'}
          </button>
        </div>
      </div>

      {/* Test result */}
      {testResult && (
        <div style={{ padding:'12px 16px', borderRadius:12, marginBottom:20, fontSize:13,
          background:testResult.ok?'rgba(16,185,129,0.1)':'rgba(239,68,68,0.1)',
          border:`1px solid ${testResult.ok?'rgba(16,185,129,0.3)':'rgba(239,68,68,0.3)'}`,
          color:testResult.ok?'#10b981':'#ef4444' }}>
          {testResult.ok?`✅ ${isAr?'نجح! الرد:':'OK! Reply:'} "${testResult.msg}" (${testResult.model})`:`❌ ${testResult.msg}`}
        </div>
      )}

      {/* Provider */}
      <div className="card" style={{ marginBottom:20 }}>
        <h3 style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>🔌 {isAr?'المزود':'Provider'}</h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))', gap:10 }}>
          {PROVIDERS.map(p => (
            <div key={p.id} onClick={()=>update({provider:p.id, baseUrl:p.baseUrl, model:p.models[0]||cfg.model})}
              style={{ padding:'12px 8px', borderRadius:12, textAlign:'center', cursor:'pointer',
                border:`2px solid ${cfg.provider===p.id?'#6366f1':'#334155'}`,
                background:cfg.provider===p.id?'rgba(99,102,241,0.12)':'transparent' }}>
              <div style={{ fontSize:22, marginBottom:4 }}>{p.icon}</div>
              <div style={{ fontSize:12, fontWeight:600, color:cfg.provider===p.id?'#818cf8':'#94a3b8' }}>{p.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* API Key + Base URL + Model */}
      <div className="card" style={{ marginBottom:20 }}>
        <h3 style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>🔑 {isAr?'الاتصال':'Connection'}</h3>
        <div style={{ marginBottom:14 }}>
          <label style={{ display:'block', marginBottom:5, fontSize:13, color:'#94a3b8' }}>{isAr?'مفتاح API':'API Key'}</label>
          <div style={{ position:'relative' }}>
            <input className="input" type={showKey?'text':'password'} value={cfg.apiKey}
              onChange={e=>update({apiKey:e.target.value})} placeholder={provider.keyHint} style={{ paddingRight:40 }} />
            <button onClick={()=>setShowKey(v=>!v)} style={{ position:'absolute', top:'50%', right:12, transform:'translateY(-50%)',
              background:'none', border:'none', cursor:'pointer', color:'#64748b', fontSize:16 }}>
              {showKey?'🙈':'👁️'}
            </button>
          </div>
          {provider.docsUrl && <a href={provider.docsUrl} target="_blank" rel="noreferrer" style={{ fontSize:12, color:'#6366f1', textDecoration:'none', marginTop:5, display:'inline-block' }}>🔗 {isAr?'احصل على مفتاح':'Get API Key'} ↗</a>}
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ display:'block', marginBottom:5, fontSize:13, color:'#94a3b8' }}>Base URL</label>
          <input className="input" value={cfg.baseUrl} onChange={e=>update({baseUrl:e.target.value})} placeholder={provider.baseUrl||'https://api.example.com/v1'} />
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ display:'block', marginBottom:5, fontSize:13, color:'#94a3b8' }}>{isAr?'النموذج':'Model'}</label>
          {provider.models.length > 0 && (
            <select className="input" value={provider.models.includes(cfg.model)?cfg.model:'custom'}
              onChange={e=>{ if(e.target.value==='custom') update({model:customModel||''}); else update({model:e.target.value}); }}>
              {provider.models.map(m=><option key={m} value={m}>{m}</option>)}
              <option value="custom">{isAr?'⌨️ يدوي':'⌨️ Custom'}</option>
            </select>
          )}
          {(!provider.models.includes(cfg.model) || cfg.provider==='custom') && (
            <input className="input" style={{ marginTop:provider.models.length?8:0 }} value={customModel||cfg.model}
              onChange={e=>{setCustomModel(e.target.value); update({model:e.target.value});}}
              placeholder={isAr?'اسم النموذج':'Model name'} />
          )}
        </div>
      </div>

      {/* Generation Settings */}
      <div className="card" style={{ marginBottom:20 }}>
        <h3 style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>⚙️ {isAr?'إعدادات التوليد':'Generation'}</h3>
        <div className="grid grid-2">
          <div>
            <label style={{ display:'block', marginBottom:5, fontSize:13, color:'#94a3b8' }}>Temperature: {cfg.temperature}</label>
            <input type="range" min="0" max="2" step="0.05" value={cfg.temperature}
              onChange={e=>update({temperature:parseFloat(e.target.value)})} style={{ width:'100%', accentColor:'#6366f1' }} />
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#475569' }}>
              <span>0 {isAr?'دقيق':'Precise'}</span><span>2 {isAr?'إبداعي':'Creative'}</span>
            </div>
          </div>
          <div>
            <label style={{ display:'block', marginBottom:5, fontSize:13, color:'#94a3b8' }}>Max Tokens: {cfg.maxTokens}</label>
            <input type="range" min="50" max="2000" step="50" value={cfg.maxTokens}
              onChange={e=>update({maxTokens:parseInt(e.target.value)})} style={{ width:'100%', accentColor:'#6366f1' }} />
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#475569' }}>
              <span>50</span><span>2000</span>
            </div>
          </div>
        </div>
        <div style={{ marginTop:14 }}>
          <label style={{ display:'block', marginBottom:5, fontSize:13, color:'#94a3b8' }}>{isAr?'لغة الرد':'Reply Language'}</label>
          <select className="input" value={cfg.replyLanguage} onChange={e=>update({replyLanguage:e.target.value})}>
            <option value="auto">{isAr?'تلقائي (نفس لغة المستخدم)':'Auto (match user)'}</option>
            <option value="ar">🇸🇦 {isAr?'عربي':'Arabic'}</option>
            <option value="en">🇺🇸 {isAr?'إنجليزي':'English'}</option>
          </select>
        </div>
      </div>

      {/* Global Prompt */}
      <div className="card" style={{ marginBottom:20 }}>
        <h3 style={{ fontSize:15, fontWeight:700, marginBottom:6 }}>📝 {isAr?'التعليمات العامة':'Global System Prompt'}</h3>
        <p style={{ fontSize:12, color:'#64748b', marginBottom:12 }}>{isAr?'تُطبّق على جميع بوتاتك. كل بوت يمكنه إضافة تعليمات خاصة فوق هذه.':'Applied to all bots. Each bot can add its own prompt on top.'}</p>
        <textarea className="input" rows={5} value={cfg.globalSystemPrompt}
          onChange={e=>update({globalSystemPrompt:e.target.value})}
          placeholder={isAr?'مثال: أنت مساعد خدمة عملاء. أجب باختصار...':'e.g. You are a customer service agent. Reply briefly...'} />
        <div style={{ marginTop:10 }}>
          <p style={{ fontSize:12, color:'#64748b', marginBottom:6 }}>{isAr?'⚡ قوالب:':'⚡ Templates:'}</p>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {[
              {ar:'خدمة عملاء', en:'Customer Service', p:isAr?'أنت مساعد خدمة عملاء محترف. أجب باختصار.':'You are a professional customer service agent. Reply briefly.'},
              {ar:'ردود قصيرة', en:'Short Replies', p:isAr?'أجب بجملة أو جملتين فقط.':'Reply in 1-2 sentences only.'},
              {ar:'ثنائي اللغة', en:'Bilingual', p:'Detect the language of incoming messages and reply in the SAME language.'},
            ].map(t=>(
              <button key={t.en} onClick={()=>update({globalSystemPrompt:t.p})}
                style={{ background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.25)',
                  color:'#818cf8', borderRadius:8, padding:'5px 12px', cursor:'pointer', fontSize:12 }}>
                {isAr?t.ar:t.en}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="card" style={{ background:'rgba(99,102,241,0.05)', border:'1px solid rgba(99,102,241,0.15)' }}>
        <h3 style={{ fontSize:14, fontWeight:600, marginBottom:10 }}>💡 {isAr?'كيف يعمل؟':'How it works?'}</h3>
        <ol style={{ fontSize:13, color:'#94a3b8', lineHeight:2.2, paddingInlineStart:18 }}>
          <li>{isAr?'فعّل "استخدام AI" عند إنشاء أي بوت':'Enable "Use AI" when creating a bot'}</li>
          <li>{isAr?'عند ورود تعليق/رسالة → يُرسل للنموذج ويُرد تلقائياً':'When a comment/message arrives → sent to AI → auto-replied'}</li>
          <li>{isAr?'يمكنك إضافة تعليمات خاصة لكل بوت':'You can add per-bot custom prompts'}</li>
          <li>{isAr?'يعمل مع أي مزود يدعم OpenAI-compatible API':'Works with any OpenAI-compatible API provider'}</li>
        </ol>
      </div>
    </div>
  );
}
