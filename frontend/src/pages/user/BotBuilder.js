import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = process.env.REACT_APP_API_URL || '/api';

const PLATFORM_INFO = {
  facebook:  { label: 'Facebook',  emoji: '📘', color: '#1877F2' },
  instagram: { label: 'Instagram', emoji: '📸', color: '#E1306C' },
  whatsapp:  { label: 'WhatsApp',  emoji: '💬', color: '#25D366' },
  telegram:  { label: 'Telegram',  emoji: '✈️',  color: '#0088CC' },
  tiktok:    { label: 'TikTok',    emoji: '🎵', color: '#FE2C55' },
  all:       { label: 'All',       emoji: '🌐', color: '#6366f1' },
};

const newReply = (order = 0) => ({
  message: '', imageUrl: '', linkUrl: '', linkText: '',
  delayEnabled: false, delay: 5, isEnabled: true, order,
});
const newAction = () => ({
  type: 'comment', language: 'both',
  message: '', imageUrl: '', linkUrl: '', linkText: '', delay: 0,
  replies: [newReply(0)],
});
const newDMRule = (platform = 'facebook') => ({
  pageId: '', platform, postId: '', postLabel: '',
  isEnabled: true, keywords: [], matchAll: false,
  replies: [newReply(0)],
});

/* ─── ReplyCard ──────────────────────────────────────────────────────── */
function ReplyCard({ reply, index, total, isAr, onUpdate, onRemove, onMove }) {
  const ref = useRef(null);
  const onDragStart = e => { e.dataTransfer.setData('ri', String(index)); if(ref.current) ref.current.style.opacity='0.4'; };
  const onDragEnd   = () => { if(ref.current) ref.current.style.opacity='1'; };
  const onDragOver  = e => e.preventDefault();
  const onDrop      = e => { e.preventDefault(); const f=parseInt(e.dataTransfer.getData('ri'),10); if(f!==index) onMove(f,index); };

  return (
    <div ref={ref} draggable onDragStart={onDragStart} onDragEnd={onDragEnd} onDragOver={onDragOver} onDrop={onDrop}
      style={{ background:'#1e293b', borderRadius:12, padding:14, marginBottom:10, cursor:'grab',
        border: reply.isEnabled ? '1px solid #334155' : '1px solid rgba(239,68,68,0.3)',
        opacity: reply.isEnabled ? 1 : 0.5, transition:'all 0.2s' }}>

      {/* header */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
        <span style={{ color:'#475569', fontSize:16, userSelect:'none', cursor:'grab' }}>⠿</span>
        <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
          <button onClick={() => onMove(index, index-1)} disabled={index===0}
            style={{ background:'none', border:'none', color:index===0?'#334155':'#6366f1', cursor:index===0?'default':'pointer', fontSize:11, lineHeight:1, padding:0 }}>▲</button>
          <button onClick={() => onMove(index, index+1)} disabled={index===total-1}
            style={{ background:'none', border:'none', color:index===total-1?'#334155':'#6366f1', cursor:index===total-1?'default':'pointer', fontSize:11, lineHeight:1, padding:0 }}>▼</button>
        </div>
        <span style={{ fontSize:12, fontWeight:700, color:'#818cf8', flex:1 }}>
          {isAr ? `رد ${index+1}` : `Reply ${index+1}`}
        </span>
        <label style={{ display:'flex', alignItems:'center', gap:5, cursor:'pointer' }}>
          <label className="switch" style={{ width:36, height:20 }}>
            <input type="checkbox" checked={reply.isEnabled!==false} onChange={e => onUpdate({ isEnabled:e.target.checked })} />
            <span className="slider" style={{ borderRadius:20 }}></span>
          </label>
          <span style={{ fontSize:11, color: reply.isEnabled!==false ? '#10b981' : '#ef4444' }}>
            {reply.isEnabled!==false ? (isAr?'مفعّل':'On') : (isAr?'معطّل':'Off')}
          </span>
        </label>
        <button onClick={onRemove}
          style={{ background:'rgba(239,68,68,0.1)', color:'#ef4444', border:'none', borderRadius:6, width:26, height:26, cursor:'pointer', fontWeight:700 }}>✕</button>
      </div>

      <textarea className="input" rows={2} value={reply.message} placeholder={isAr?'نص الرد...':'Reply text...'}
        onChange={e => onUpdate({ message:e.target.value })} style={{ marginBottom:8 }} />

      <div className="grid grid-2" style={{ marginBottom:8 }}>
        <div>
          <label style={{ fontSize:11, color:'#64748b', display:'block', marginBottom:3 }}>🖼️ {isAr?'صورة (اختياري)':'Image (opt)'}</label>
          <input className="input" value={reply.imageUrl} onChange={e => onUpdate({ imageUrl:e.target.value })} placeholder="https://..." />
        </div>
        <div>
          <label style={{ fontSize:11, color:'#64748b', display:'block', marginBottom:3 }}>🔗 {isAr?'رابط (اختياري)':'Link (opt)'}</label>
          <input className="input" value={reply.linkUrl} onChange={e => onUpdate({ linkUrl:e.target.value })} placeholder="https://..." />
        </div>
      </div>
      {reply.linkUrl && (
        <div style={{ marginBottom:8 }}>
          <label style={{ fontSize:11, color:'#64748b', display:'block', marginBottom:3 }}>{isAr?'نص الرابط':'Link text'}</label>
          <input className="input" value={reply.linkText} onChange={e => onUpdate({ linkText:e.target.value })} placeholder={isAr?'اضغط هنا':'Click here'} />
        </div>
      )}

      {/* delay */}
      <div style={{ display:'flex', alignItems:'center', gap:10, background:'#0f172a', borderRadius:8, padding:'8px 12px' }}>
        <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', flexShrink:0 }}>
          <label className="switch" style={{ width:36, height:20 }}>
            <input type="checkbox" checked={!!reply.delayEnabled}
              onChange={e => onUpdate({ delayEnabled:e.target.checked, delay:e.target.checked?(reply.delay||5):0 })} />
            <span className="slider" style={{ borderRadius:20 }}></span>
          </label>
          <span style={{ fontSize:11, color:'#94a3b8', whiteSpace:'nowrap' }}>⏱️ {isAr?'تأخير':'Delay'}</span>
        </label>
        {reply.delayEnabled ? (
          <div style={{ display:'flex', alignItems:'center', gap:6, flex:1 }}>
            <input type="range" min="1" max="300" step="1" value={reply.delay||5}
              onChange={e => onUpdate({ delay:Number(e.target.value) })} style={{ flex:1, accentColor:'#6366f1' }} />
            <span style={{ fontSize:12, color:'#818cf8', fontWeight:700, minWidth:48, textAlign:'center' }}>
              {reply.delay||5}{isAr?' ث':'s'}
            </span>
          </div>
        ) : (
          <span style={{ fontSize:11, color:'#475569' }}>{isAr?'فوري':'Instant'}</span>
        )}
      </div>
    </div>
  );
}

/* ─── RepliesList ────────────────────────────────────────────────────── */
function RepliesList({ replies=[], onChange, isAr }) {
  const move = (from, to) => {
    if (to<0||to>=replies.length) return;
    const arr=[...replies]; const [it]=arr.splice(from,1); arr.splice(to,0,it);
    onChange(arr.map((r,i)=>({...r,order:i})));
  };
  const upd = (i,p) => { const arr=[...replies]; arr[i]={...arr[i],...p}; onChange(arr); };
  const del = (i) => onChange(replies.filter((_,x)=>x!==i).map((r,i)=>({...r,order:i})));
  const add = () => onChange([...replies, newReply(replies.length)]);
  return (
    <div>
      {replies.length===0 && (
        <div style={{ textAlign:'center', padding:'18px 0', color:'#475569', border:'1px dashed #334155', borderRadius:10, marginBottom:10, fontSize:13 }}>
          💬 {isAr?'لا توجد ردود — أضف رداً':'No replies — add one'}
        </div>
      )}
      {replies.map((r,i)=>(
        <ReplyCard key={i} reply={r} index={i} total={replies.length} isAr={isAr}
          onUpdate={p=>upd(i,p)} onRemove={()=>del(i)} onMove={move} />
      ))}
      <button onClick={add}
        style={{ width:'100%', background:'rgba(99,102,241,0.07)', border:'1px dashed rgba(99,102,241,0.4)',
          color:'#818cf8', borderRadius:10, padding:'9px 0', cursor:'pointer', fontSize:13, fontWeight:600,
          display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
        + {isAr?'إضافة رد':'Add Reply'}
      </button>
    </div>
  );
}

/* ─── ActionCard ─────────────────────────────────────────────────────── */
function ActionCard({ action, index, total, isAr, useAI, onUpdate, onRemove, onMove }) {
  const u = p => onUpdate({...action,...p});
  return (
    <div style={{ background:'#0f172a', borderRadius:14, padding:16, marginBottom:14, border:'1px solid #334155' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', borderRadius:8, padding:'3px 10px', fontSize:12, fontWeight:700 }}>
            {isAr?`إجراء ${index+1}`:`Action ${index+1}`}
          </span>
          <span style={{ fontSize:12, color:'#64748b' }}>
            {action.type==='comment'?'💬':action.type==='dm'?'📩':'👍'}
            {' '}{isAr?(action.type==='comment'?'تعليق':action.type==='dm'?'رسالة':'تفاعل'):(action.type==='comment'?'Comment':action.type==='dm'?'DM':'Reaction')}
          </span>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {index>0 && <button onClick={()=>onMove(index,index-1)} style={{ background:'none', border:'1px solid #334155', color:'#6366f1', borderRadius:6, padding:'3px 8px', cursor:'pointer', fontSize:12 }}>↑</button>}
          {index<total-1 && <button onClick={()=>onMove(index,index+1)} style={{ background:'none', border:'1px solid #334155', color:'#6366f1', borderRadius:6, padding:'3px 8px', cursor:'pointer', fontSize:12 }}>↓</button>}
          {total>1 && <button onClick={onRemove} style={{ background:'rgba(239,68,68,0.1)', color:'#ef4444', border:'none', borderRadius:8, padding:'5px 12px', cursor:'pointer', fontSize:12 }}>{isAr?'حذف':'Remove'}</button>}
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom:14 }}>
        <div>
          <label style={{ fontSize:12, color:'#64748b', display:'block', marginBottom:4 }}>{isAr?'نوع الإجراء':'Action Type'}</label>
          <select className="input" value={action.type} onChange={e=>u({type:e.target.value})}>
            <option value="comment">💬 {isAr?'رد على التعليق':'Comment Reply'}</option>
            <option value="dm">📩 {isAr?'رسالة مباشرة':'Direct Message'}</option>
            <option value="reaction">👍 {isAr?'تفاعل':'Reaction'}</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize:12, color:'#64748b', display:'block', marginBottom:4 }}>{isAr?'اللغة':'Language'}</label>
          <select className="input" value={action.language||'both'} onChange={e=>u({language:e.target.value})}>
            <option value="both">🌐 {isAr?'عربي + إنجليزي':'Both'}</option>
            <option value="ar">🇸🇦 {isAr?'عربي':'Arabic'}</option>
            <option value="en">🇺🇸 {isAr?'إنجليزي':'English'}</option>
          </select>
        </div>
      </div>

      {useAI ? (
        <div style={{ background:'rgba(139,92,246,0.08)', border:'1px solid rgba(139,92,246,0.25)', borderRadius:10, padding:'12px 16px', fontSize:13, color:'#a78bfa' }}>
          🧠 {isAr?'سيرد الذكاء الاصطناعي تلقائياً بناءً على إعدادات AI Settings':'AI will reply automatically based on AI Settings'}
        </div>
      ) : action.type==='comment' ? (
        <RepliesList replies={action.replies||[]} onChange={rs=>u({replies:rs})} isAr={isAr} />
      ) : action.type==='dm' ? (
        <div>
          <label style={{ fontSize:12, color:'#64748b', display:'block', marginBottom:4 }}>{isAr?'نص الرسالة':'Message'}</label>
          <textarea className="input" rows={3} value={action.message||''} onChange={e=>u({message:e.target.value})}
            placeholder={isAr?'نص الرسالة...':'Message text...'} style={{ marginBottom:8 }} />
          <div className="grid grid-2" style={{ marginBottom:8 }}>
            <div>
              <label style={{ fontSize:12, color:'#64748b', display:'block', marginBottom:3 }}>🖼️ {isAr?'صورة':'Image'}</label>
              <input className="input" value={action.imageUrl||''} onChange={e=>u({imageUrl:e.target.value})} placeholder="https://..." />
            </div>
            <div>
              <label style={{ fontSize:12, color:'#64748b', display:'block', marginBottom:3 }}>🔗 {isAr?'رابط':'Link'}</label>
              <input className="input" value={action.linkUrl||''} onChange={e=>u({linkUrl:e.target.value})} placeholder="https://..." />
            </div>
          </div>
          {action.linkUrl && (
            <div style={{ marginBottom:8 }}>
              <label style={{ fontSize:12, color:'#64748b', display:'block', marginBottom:3 }}>{isAr?'نص الرابط':'Link Text'}</label>
              <input className="input" value={action.linkText||''} onChange={e=>u({linkText:e.target.value})} placeholder={isAr?'اضغط هنا':'Click here'} />
            </div>
          )}
          <div style={{ display:'flex', alignItems:'center', gap:10, background:'#1e293b', borderRadius:8, padding:'8px 12px' }}>
            <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', flexShrink:0 }}>
              <label className="switch" style={{ width:36, height:20 }}>
                <input type="checkbox" checked={(action.delay||0)>0} onChange={e=>u({delay:e.target.checked?5:0})} />
                <span className="slider" style={{ borderRadius:20 }}></span>
              </label>
              <span style={{ fontSize:11, color:'#94a3b8', whiteSpace:'nowrap' }}>⏱️ {isAr?'تأخير':'Delay'}</span>
            </label>
            {(action.delay||0)>0 ? (
              <div style={{ display:'flex', alignItems:'center', gap:6, flex:1 }}>
                <input type="range" min="1" max="300" step="1" value={action.delay||5} onChange={e=>u({delay:Number(e.target.value)})} style={{ flex:1, accentColor:'#6366f1' }} />
                <span style={{ fontSize:12, color:'#818cf8', fontWeight:700, minWidth:48, textAlign:'center' }}>{action.delay}{isAr?' ث':'s'}</span>
              </div>
            ) : <span style={{ fontSize:11, color:'#475569' }}>{isAr?'فوري':'Instant'}</span>}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ─── PostCommentDMRule ──────────────────────────────────────────────── */
function PostCommentDMRule({ rule, index, pages, isAr, onUpdate, onRemove }) {
  const [posts, setPosts]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [kwInput, setKwInput] = useState('');

  const platPages = pages.filter(p => p.platform===rule.platform);

  const fetchPosts = async pid => {
    if (!pid) return; setLoading(true);
    try { const r=await axios.get(`${API}/posts/${pid}`); setPosts(r.data||[]); }
    catch { setPosts([]); } finally { setLoading(false); }
  };
  useEffect(()=>{ if(rule.pageId) fetchPosts(rule.pageId); },[rule.pageId]);

  const addKw=()=>{ const k=kwInput.trim(); if(!k) return; onUpdate({keywords:[...(rule.keywords||[]),k]}); setKwInput(''); };
  const delKw=i=>{ const a=[...(rule.keywords||[])]; a.splice(i,1); onUpdate({keywords:a}); };

  return (
    <div style={{ background:'#0f172a', borderRadius:14, padding:16, marginBottom:14,
      border:rule.isEnabled?'1px solid #334155':'1px solid rgba(239,68,68,0.2)',
      opacity:rule.isEnabled?1:0.6, transition:'all 0.2s' }}>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:20 }}>{PLATFORM_INFO[rule.platform]?.emoji||'🌐'}</span>
          <span style={{ fontWeight:700, fontSize:14 }}>{isAr?`قاعدة DM ${index+1}`:`DM Rule ${index+1}`}</span>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <label style={{ display:'flex', alignItems:'center', gap:5, cursor:'pointer' }}>
            <label className="switch" style={{ width:36, height:20 }}>
              <input type="checkbox" checked={rule.isEnabled!==false} onChange={e=>onUpdate({isEnabled:e.target.checked})} />
              <span className="slider" style={{ borderRadius:20 }}></span>
            </label>
            <span style={{ fontSize:11, color:rule.isEnabled!==false?'#10b981':'#ef4444' }}>
              {rule.isEnabled!==false?(isAr?'مفعّل':'On'):(isAr?'معطّل':'Off')}
            </span>
          </label>
          <button onClick={onRemove} style={{ background:'rgba(239,68,68,0.1)', color:'#ef4444', border:'none', borderRadius:8, padding:'4px 10px', cursor:'pointer', fontSize:12 }}>
            {isAr?'حذف':'Remove'}
          </button>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom:12 }}>
        <div>
          <label style={{ fontSize:12, color:'#64748b', display:'block', marginBottom:4 }}>{isAr?'المنصة':'Platform'}</label>
          <select className="input" value={rule.platform} onChange={e=>onUpdate({platform:e.target.value,pageId:'',postId:'',postLabel:''})}>
            {['facebook','instagram','whatsapp','telegram','tiktok'].map(p=>(
              <option key={p} value={p}>{PLATFORM_INFO[p].emoji} {PLATFORM_INFO[p].label}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontSize:12, color:'#64748b', display:'block', marginBottom:4 }}>{isAr?'الصفحة':'Page'}</label>
          <select className="input" value={rule.pageId} onChange={e=>{ onUpdate({pageId:e.target.value,postId:'',postLabel:''}); fetchPosts(e.target.value); }}>
            <option value="">{isAr?'— اختر صفحة —':'— Select page —'}</option>
            {platPages.map(p=><option key={p._id} value={p._id}>{p.pageName}</option>)}
          </select>
        </div>
      </div>

      <div style={{ marginBottom:12 }}>
        <label style={{ fontSize:12, color:'#64748b', display:'block', marginBottom:4 }}>
          📌 {isAr?'المنشور (فارغ = أي منشور)':'Post (empty = any post)'}
        </label>
        <select className="input" value={rule.postId} disabled={!rule.pageId}
          onChange={e=>{ const o=posts.find(p=>p.id===e.target.value); onUpdate({postId:e.target.value,postLabel:o?.message?.slice(0,60)||''}); }}>
          <option value="">{isAr?'🌐 أي منشور على هذه الصفحة':'🌐 Any post on this page'}</option>
          {loading && <option disabled>{isAr?'جاري التحميل...':'Loading...'}</option>}
          {posts.map(p=>(
            <option key={p.id} value={p.id}>{p.message?p.message.slice(0,70):`[post ${p.id.slice(-6)}]`}</option>
          ))}
        </select>
        {!rule.pageId && <p style={{ fontSize:11, color:'#475569', marginTop:4 }}>{isAr?'← اختر صفحة لتحميل المنشورات':'← Select a page to load posts'}</p>}
      </div>

      <div style={{ marginBottom:12 }}>
        <label style={{ fontSize:12, color:'#64748b', display:'block', marginBottom:4 }}>🔑 {isAr?'فلتر كلمات مفتاحية (اختياري)':'Keyword Filter (optional)'}</label>
        <div style={{ display:'flex', gap:6, marginBottom:6 }}>
          <input className="input" value={kwInput} onChange={e=>setKwInput(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&addKw()} placeholder={isAr?'كلمة...':'keyword...'} style={{ flex:1 }} />
          <button onClick={addKw} className="btn btn-sm btn-outline">{isAr?'إضافة':'Add'}</button>
        </div>
        {(rule.keywords||[]).length>0 && (
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:6 }}>
            {rule.keywords.map((kw,i)=>(
              <span key={i} style={{ background:'rgba(99,102,241,0.1)', color:'#818cf8', borderRadius:6, padding:'3px 10px', fontSize:12, display:'flex', alignItems:'center', gap:5 }}>
                {kw}
                <button onClick={()=>delKw(i)} style={{ background:'none', border:'none', color:'#ef4444', cursor:'pointer', fontSize:12, padding:0 }}>✕</button>
              </span>
            ))}
          </div>
        )}
        {(rule.keywords||[]).length>1 && (
          <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#64748b', cursor:'pointer' }}>
            <input type="checkbox" checked={rule.matchAll} onChange={e=>onUpdate({matchAll:e.target.checked})} />
            {isAr?'يجب تطابق جميع الكلمات (AND)':'All keywords must match (AND)'}
          </label>
        )}
      </div>

      <div style={{ background:'#1e293b', borderRadius:10, padding:12 }}>
        <p style={{ fontSize:12, color:'#94a3b8', marginBottom:10, fontWeight:600 }}>
          📩 {isAr?'رسائل تُرسل للمعلق بعد التعليق:':'DMs sent to commenter:'}
        </p>
        <RepliesList replies={rule.replies||[]} onChange={rs=>onUpdate({replies:rs})} isAr={isAr} />
      </div>
    </div>
  );
}

/* ─── Main BotBuilder ────────────────────────────────────────────────── */
export default function BotBuilder() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const navigate = useNavigate();
  const { id }   = useParams();
  const isEdit   = !!id;

  const [pages,  setPages]  = useState([]);
  const [saving, setSaving] = useState(false);
  const [tab,    setTab]    = useState('actions');

  const [bot, setBot] = useState({
    name:'', platform:'facebook', type:'comment_reply',
    isActive:true, useAI:false, aiPrompt:'',
    allPosts:true, targetPosts:[], triggers:[],
    actions:[newAction()], postCommentDMs:[], pageId:'',
  });

  useEffect(()=>{
    axios.get(`${API}/pages`).then(r=>setPages(r.data)).catch(()=>{});
    if (isEdit) {
      axios.get(`${API}/bots/${id}`).then(r=>{
        const b=r.data;
        if(!b.actions||!b.actions.length) b.actions=[newAction()];
        if(!b.postCommentDMs) b.postCommentDMs=[];
        setBot(b);
      }).catch(()=>toast.error(isAr?'فشل تحميل البوت':'Failed to load bot'));
    }
  },[id]);

  const upd = patch => setBot(prev=>({...prev,...patch}));

  /* triggers */
  const addTrig = ()=>upd({triggers:[...(bot.triggers||[]),{keyword:'',matchType:'contains',caseSensitive:false}]});
  const delTrig = i=>upd({triggers:bot.triggers.filter((_,x)=>x!==i)});
  const setTrig = (i,p)=>{ const t=[...bot.triggers]; t[i]={...t[i],...p}; upd({triggers:t}); };

  /* actions */
  const addAct  = ()=>upd({actions:[...bot.actions, newAction()]});
  const delAct  = i=>upd({actions:bot.actions.filter((_,x)=>x!==i)});
  const setAct  = (i,v)=>{ const a=[...bot.actions]; a[i]=v; upd({actions:a}); };
  const movAct  = (f,t)=>{
    if(t<0||t>=bot.actions.length) return;
    const a=[...bot.actions]; const [it]=a.splice(f,1); a.splice(t,0,it); upd({actions:a});
  };

  /* post-comment DMs */
  const addDMR  = ()=>upd({postCommentDMs:[...(bot.postCommentDMs||[]), newDMRule(bot.platform==='all'?'facebook':bot.platform)]});
  const delDMR  = i=>upd({postCommentDMs:bot.postCommentDMs.filter((_,x)=>x!==i)});
  const setDMR  = (i,p)=>{ const a=[...bot.postCommentDMs]; a[i]={...a[i],...p}; upd({postCommentDMs:a}); };

  const handleSave = async()=>{
    if(!bot.name.trim()) return toast.error(isAr?'أدخل اسم البوت':'Enter bot name');
    setSaving(true);
    try {
      if (isEdit) { await axios.put(`${API}/bots/${id}`,bot); toast.success(isAr?'✅ تم التحديث':'✅ Updated'); }
      else         { await axios.post(`${API}/bots`,bot);      toast.success(isAr?'✅ تم الإنشاء':'✅ Created'); }
      navigate('/dashboard/bots');
    } catch(err){ toast.error(err.response?.data?.error||(isAr?'حدث خطأ':'Error')); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ maxWidth:860 }}>
      {/* Header */}
      <div className="page-header flex-between">
        <div>
          <h1>{isEdit?(isAr?'✏️ تعديل البوت':'✏️ Edit Bot'):(isAr?'🤖 إنشاء بوت':'🤖 Create Bot')}</h1>
          <p style={{ color:'#64748b', marginTop:3 }}>{isAr?'إعدادات البوت والردود التلقائية ورسائل ما بعد التعليق':'Bot settings, auto-replies, and post-comment DMs'}</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={()=>navigate('/dashboard/bots')} className="btn btn-outline">{isAr?'إلغاء':'Cancel'}</button>
          <button onClick={handleSave} className="btn btn-primary" disabled={saving}>{saving?'⏳':(isAr?'💾 حفظ':'💾 Save')}</button>
        </div>
      </div>

      {/* Basic Settings */}
      <div className="card" style={{ marginBottom:20 }}>
        <h3 style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>⚙️ {isAr?'الإعدادات الأساسية':'Basic Settings'}</h3>
        <div className="grid grid-2" style={{ marginBottom:14 }}>
          <div>
            <label style={{ display:'block', marginBottom:5, fontSize:13, color:'#94a3b8' }}>{isAr?'اسم البوت':'Bot Name'}</label>
            <input className="input" value={bot.name} onChange={e=>upd({name:e.target.value})} placeholder={isAr?'مثال: بوت الرد التلقائي':'e.g. Auto Reply Bot'} />
          </div>
          <div>
            <label style={{ display:'block', marginBottom:5, fontSize:13, color:'#94a3b8' }}>{isAr?'المنصة':'Platform'}</label>
            <select className="input" value={bot.platform} onChange={e=>upd({platform:e.target.value,pageId:''})}>
              {Object.entries(PLATFORM_INFO).map(([k,v])=><option key={k} value={k}>{v.emoji} {v.label}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-2" style={{ marginBottom:14 }}>
          <div>
            <label style={{ display:'block', marginBottom:5, fontSize:13, color:'#94a3b8' }}>{isAr?'نوع البوت':'Bot Type'}</label>
            <select className="input" value={bot.type} onChange={e=>upd({type:e.target.value})}>
              <option value="comment_reply">💬 {isAr?'رد على التعليقات':'Comment Reply'}</option>
              <option value="dm_reply">📩 {isAr?'رد على الرسائل':'DM Reply'}</option>
              <option value="post_dm">🔄 {isAr?'رسالة بعد التعليق':'Post Comment DM'}</option>
              <option value="keyword">🔑 {isAr?'كلمات مفتاحية':'Keyword Trigger'}</option>
              <option value="ai">🧠 {isAr?'ذكاء اصطناعي':'AI Bot'}</option>
              <option value="sequence">📋 {isAr?'تسلسل رسائل':'Sequence'}</option>
            </select>
          </div>
          <div>
            <label style={{ display:'block', marginBottom:5, fontSize:13, color:'#94a3b8' }}>{isAr?'الصفحة':'Page'}</label>
            <select className="input" value={bot.pageId||''} onChange={e=>upd({pageId:e.target.value})}>
              <option value="">{isAr?'🌐 كل الصفحات':'🌐 All Pages'}</option>
              {pages.filter(p=>bot.platform==='all'||p.platform===bot.platform).map(p=>(
                <option key={p._id} value={p._id}>{p.pageName}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ display:'flex', gap:20, flexWrap:'wrap', alignItems:'center' }}>
          {[{k:'isActive',ar:'مفعّل',en:'Active',ic:'✅'},{k:'useAI',ar:'ذكاء اصطناعي',en:'Use AI',ic:'🧠'},{k:'allPosts',ar:'كل المنشورات',en:'All Posts',ic:'📌'}].map(({k,ar,en,ic})=>(
            <label key={k} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
              <label className="switch"><input type="checkbox" checked={!!bot[k]} onChange={e=>upd({[k]:e.target.checked})} /><span className="slider"></span></label>
              <span style={{ fontSize:13 }}>{ic} {isAr?ar:en}</span>
            </label>
          ))}
        </div>
      </div>

      {/* AI Prompt */}
      {bot.useAI && (
        <div className="card" style={{ marginBottom:20, border:'1px solid rgba(139,92,246,0.3)', background:'rgba(139,92,246,0.03)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <h3 style={{ fontSize:15, fontWeight:700 }}>🧠 {isAr?'تعليمات الذكاء الاصطناعي':'AI Instructions'}</h3>
            <a href="/dashboard/ai-settings" style={{ fontSize:12, color:'#818cf8', textDecoration:'none' }}>⚙️ {isAr?'إعدادات AI':'AI Settings'} →</a>
          </div>
          <label style={{ display:'block', marginBottom:5, fontSize:13, color:'#94a3b8' }}>{isAr?'تعليمات خاصة بهذا البوت (اتركها فارغة لاستخدام التعليمات العامة)':'Per-bot prompt (leave empty to use global prompt)'}</label>
          <textarea className="input" rows={4} value={bot.aiPrompt} onChange={e=>upd({aiPrompt:e.target.value})}
            placeholder={isAr?'مثال: أنت مساعد خدمة عملاء ودود...':'e.g. You are a friendly customer service agent...'} />
        </div>
      )}

      {/* Keyword triggers */}
      {!bot.allPosts && (
        <div className="card" style={{ marginBottom:20 }}>
          <div className="flex-between" style={{ marginBottom:14 }}>
            <h3 style={{ fontSize:15, fontWeight:700 }}>🔑 {isAr?'الكلمات المفتاحية':'Keywords'}</h3>
            <button onClick={addTrig} className="btn btn-sm btn-outline">+ {isAr?'إضافة':'Add'}</button>
          </div>
          {(bot.triggers||[]).length===0 && (
            <p style={{ fontSize:13, color:'#475569', textAlign:'center', padding:'10px 0' }}>{isAr?'لا توجد كلمات — البوت سيرد على أي تعليق':'No keywords — bot replies to any comment'}</p>
          )}
          {(bot.triggers||[]).map((t,i)=>(
            <div key={i} style={{ display:'flex', gap:8, marginBottom:8, alignItems:'center' }}>
              <input className="input" value={t.keyword} style={{ flex:2 }} onChange={e=>setTrig(i,{keyword:e.target.value})} placeholder={isAr?'الكلمة المفتاحية':'Keyword'} />
              <select className="input" value={t.matchType} style={{ flex:1 }} onChange={e=>setTrig(i,{matchType:e.target.value})}>
                <option value="contains">{isAr?'يحتوي':'Contains'}</option>
                <option value="exact">{isAr?'مطابق':'Exact'}</option>
                <option value="starts_with">{isAr?'يبدأ بـ':'Starts with'}</option>
                <option value="regex">Regex</option>
              </select>
              <label style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
                <input type="checkbox" checked={!!t.caseSensitive} onChange={e=>setTrig(i,{caseSensitive:e.target.checked})} />
                <span style={{ fontSize:11, color:'#64748b' }}>Aa</span>
              </label>
              <button onClick={()=>delTrig(i)} style={{ background:'rgba(239,68,68,0.1)', color:'#ef4444', border:'none', borderRadius:8, width:34, height:34, cursor:'pointer', fontWeight:700, flexShrink:0 }}>✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:16 }}>
        {[{k:'actions',ar:'⚡ الإجراءات',en:'⚡ Actions'},{k:'postdm',ar:'📩 رسائل بعد التعليق',en:'📩 Post-Comment DMs'}].map(tab_=>(
          <button key={tab_.k} onClick={()=>setTab(tab_.k)} className={`btn btn-sm ${tab===tab_.k?'btn-primary':'btn-outline'}`}>
            {isAr?tab_.ar:tab_.en}
            {tab_.k==='postdm'&&(bot.postCommentDMs||[]).length>0&&(
              <span style={{ background:'rgba(255,255,255,0.2)', borderRadius:100, padding:'0 6px', marginRight:4, fontSize:10 }}>{bot.postCommentDMs.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* TAB: Actions */}
      {tab==='actions' && (
        <div>
          <div className="flex-between" style={{ marginBottom:12 }}>
            <p style={{ fontSize:13, color:'#64748b' }}>{isAr?'اسحب الكروت لإعادة الترتيب':'Drag cards to reorder'}</p>
            <button onClick={addAct} className="btn btn-sm btn-primary">+ {isAr?'إضافة إجراء':'Add Action'}</button>
          </div>
          {bot.actions.map((a,i)=>(
            <ActionCard key={i} action={a} index={i} total={bot.actions.length} isAr={isAr} useAI={bot.useAI}
              onUpdate={v=>setAct(i,v)} onRemove={()=>delAct(i)} onMove={movAct} />
          ))}
        </div>
      )}

      {/* TAB: Post-Comment DMs */}
      {tab==='postdm' && (
        <div>
          <div style={{ background:'rgba(99,102,241,0.07)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:12, padding:'14px 18px', marginBottom:16, fontSize:13, color:'#94a3b8', lineHeight:1.8 }}>
            <p style={{ fontWeight:700, color:'#818cf8', marginBottom:6 }}>📩 {isAr?'كيف تعمل؟':'How does this work?'}</p>
            <p>{isAr?'عندما يعلق شخص على منشور في صفحة مرتبطة، يُرسل البوت له رسالة مباشرة تلقائياً. اختر صفحة ومنشوراً محدداً أو اتركه لأي منشور.':'When someone comments on a post in a connected page, the bot automatically sends them a DM. Select a specific page and post, or leave it for any post.'}</p>
          </div>
          <div className="flex-between" style={{ marginBottom:12 }}>
            <p style={{ fontSize:13, color:'#64748b' }}>{(bot.postCommentDMs||[]).length===0?(isAr?'لا توجد قواعد':'No rules yet'):`${(bot.postCommentDMs||[]).length} ${isAr?'قاعدة':'rule(s)'}`}</p>
            <button onClick={addDMR} className="btn btn-sm btn-primary">+ {isAr?'إضافة قاعدة DM':'Add DM Rule'}</button>
          </div>
          {(bot.postCommentDMs||[]).length===0 && (
            <div style={{ textAlign:'center', padding:'48px 20px', border:'1px dashed #334155', borderRadius:14, color:'#475569' }}>
              <p style={{ fontSize:36, marginBottom:10 }}>📩</p>
              <p style={{ fontSize:15, marginBottom:12 }}>{isAr?'أضف قاعدة لإرسال رسائل تلقائية بعد التعليق':'Add a rule to auto-DM commenters'}</p>
              <button onClick={addDMR} className="btn btn-primary btn-sm">+ {isAr?'إضافة قاعدة DM':'Add DM Rule'}</button>
            </div>
          )}
          {(bot.postCommentDMs||[]).map((r,i)=>(
            <PostCommentDMRule key={i} rule={r} index={i} pages={pages} isAr={isAr}
              onUpdate={p=>setDMR(i,p)} onRemove={()=>delDMR(i)} />
          ))}
        </div>
      )}

      {/* Sticky save bar */}
      <div style={{ position:'sticky', bottom:16, background:'rgba(30,41,59,0.96)', backdropFilter:'blur(8px)',
        border:'1px solid #334155', borderRadius:14, padding:'14px 20px', display:'flex',
        justifyContent:'space-between', alignItems:'center', marginTop:24, zIndex:10 }}>
        <span style={{ fontSize:13, color:'#64748b' }}>
          {isAr?`${bot.actions.length} إجراء · ${(bot.postCommentDMs||[]).length} قاعدة DM`:`${bot.actions.length} action(s) · ${(bot.postCommentDMs||[]).length} DM rule(s)`}
        </span>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={()=>navigate('/dashboard/bots')} className="btn btn-outline">{isAr?'إلغاء':'Cancel'}</button>
          <button onClick={handleSave} className="btn btn-primary" disabled={saving}>{saving?'⏳ ...':(isAr?'💾 حفظ البوت':'💾 Save Bot')}</button>
        </div>
      </div>
    </div>
  );
}
