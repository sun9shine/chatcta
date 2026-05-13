import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = process.env.REACT_APP_API_URL || '/api';

export default function ABTests() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [tests, setTests] = useState([]);
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name:'', botId:'', platform:'',
    variants:[
      { label:'Variant A', message:'', weight:50 },
      { label:'Variant B', message:'', weight:50 },
    ]
  });

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/abtests`).then(r => setTests(r.data)),
      axios.get(`${API}/bots`).then(r => setBots(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await axios.post(`${API}/abtests`, form);
      setTests(p => [res.data, ...p]);
      setShowModal(false);
      toast.success(isAr?'تم إنشاء الاختبار':'Test created');
    } catch (err) { toast.error(err.response?.data?.error||'Error'); }
    finally { setSaving(false); }
  };

  const handleToggle = async (id) => {
    const test = tests.find(t=>t._id===id);
    const res = await axios.put(`${API}/abtests/${id}`, { isActive: !test.isActive });
    setTests(prev => prev.map(t => t._id===id ? res.data : t));
  };

  const handlePickWinner = async (id, winner) => {
    const res = await axios.put(`${API}/abtests/${id}/winner`, { winner });
    setTests(prev => prev.map(t => t._id===id ? res.data : t));
    toast.success(isAr?`تم اختيار ${winner} فائزاً`:`${winner} selected as winner`);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(isAr?'حذف هذا الاختبار؟':'Delete this test?')) return;
    await axios.delete(`${API}/abtests/${id}`);
    setTests(prev => prev.filter(t=>t._id!==id));
    toast.success(isAr?'تم الحذف':'Deleted');
  };

  if (loading) return <div style={{ padding:60, textAlign:'center', color:'#64748b' }}>...</div>;

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1>⚡ {isAr?'اختبار A/B للرسائل':'A/B Message Testing'}</h1>
          <p style={{ color:'#64748b' }}>{isAr?'اختبر رسائل مختلفة واختر الأفضل':'Test different messages and find the winner'}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">+ {isAr?'اختبار جديد':'New Test'}</button>
      </div>

      {tests.length === 0 ? (
        <div style={{ textAlign:'center', padding:80, color:'#64748b' }}>
          <p style={{ fontSize:44, marginBottom:12 }}>⚡</p>
          <p style={{ fontSize:16, marginBottom:8 }}>{isAr?'لا توجد اختبارات':'No tests yet'}</p>
          <p style={{ fontSize:13, marginBottom:24 }}>{isAr?'أنشئ اختباراً لمقارنة رسالتين وتحديد الأفضل':'Create a test to compare messages'}</p>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">{isAr?'إنشاء اختبار':'Create Test'}</button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {tests.map(test => {
            const total = test.variants.reduce((s,v) => s+(v.stats?.sent||0), 0);
            return (
              <div key={test._id} className="card">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
                  <div>
                    <h3 style={{ fontSize:16, fontWeight:700 }}>{test.name}</h3>
                    <p style={{ fontSize:12, color:'#64748b' }}>{isAr?'إجمالي الإرسال:':'Total sent:'} {test.totalSent||0}</p>
                  </div>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    {test.winner && <span className="badge" style={{ background:'rgba(16,185,129,0.15)', color:'#10b981' }}>🏆 {test.winner}</span>}
                    <label className="switch">
                      <input type="checkbox" checked={test.isActive} onChange={() => handleToggle(test._id)} disabled={!!test.winner} />
                      <span className="slider"></span>
                    </label>
                    <button onClick={() => handleDelete(test._id)} className="btn btn-sm btn-danger">✕</button>
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:`repeat(${test.variants.length},1fr)`, gap:12 }}>
                  {test.variants.map((v, idx) => {
                    const sent = v.stats?.sent || 0;
                    const pct = total > 0 ? Math.round((sent/total)*100) : 0;
                    const isWinner = test.winner === v.label;
                    return (
                      <div key={idx} style={{
                        padding:14, borderRadius:12, background:'#0f172a',
                        border: isWinner ? '2px solid #10b981' : '1px solid #334155'
                      }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                          <span style={{ fontWeight:700, fontSize:13, color: isWinner?'#10b981':'#818cf8' }}>{v.label} {isWinner&&'🏆'}</span>
                          <span style={{ fontSize:11, color:'#64748b' }}>{v.weight}%</span>
                        </div>
                        <p style={{ fontSize:12, color:'#94a3b8', marginBottom:10, lineHeight:1.5 }}>
                          {v.message?.slice(0,80)}{v.message?.length>80?'...':''}
                        </p>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, fontSize:11 }}>
                          <div style={{ background:'#1e293b', borderRadius:6, padding:'6px 8px', textAlign:'center' }}>
                            <div style={{ fontWeight:700, color:'#6366f1' }}>{sent}</div>
                            <div style={{ color:'#64748b' }}>{isAr?'مُرسل':'Sent'}</div>
                          </div>
                          <div style={{ background:'#1e293b', borderRadius:6, padding:'6px 8px', textAlign:'center' }}>
                            <div style={{ fontWeight:700, color:'#10b981' }}>{v.stats?.replies||0}</div>
                            <div style={{ color:'#64748b' }}>{isAr?'رد':'Reply'}</div>
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div style={{ marginTop:8, height:4, background:'#334155', borderRadius:4, overflow:'hidden' }}>
                          <div style={{ width:`${pct}%`, height:'100%', background: isWinner?'#10b981':'#6366f1', borderRadius:4, transition:'width 0.5s' }} />
                        </div>
                        {!test.winner && test.isActive && (
                          <button onClick={() => handlePickWinner(test._id, v.label)} className="btn btn-sm" style={{ width:'100%', marginTop:8, background:'rgba(16,185,129,0.1)', color:'#10b981', border:'none', fontSize:11 }}>
                            {isAr?'اختر فائزاً':'Pick as Winner'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth:580 }}>
            <h3 className="modal-title">⚡ {isAr?'اختبار A/B جديد':'New A/B Test'}</h3>
            <form onSubmit={handleCreate}>
              <div className="grid grid-2" style={{ marginBottom:14 }}>
                <div>
                  <label style={{ display:'block', marginBottom:6, fontSize:13, color:'#94a3b8' }}>{isAr?'اسم الاختبار':'Test Name'}</label>
                  <input className="input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
                </div>
                <div>
                  <label style={{ display:'block', marginBottom:6, fontSize:13, color:'#94a3b8' }}>{isAr?'البوت':'Bot'}</label>
                  <select className="input" value={form.botId} onChange={e=>setForm({...form,botId:e.target.value})}>
                    <option value="">{isAr?'(اختياري)':'(optional)'}</option>
                    {bots.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              {form.variants.map((v, idx) => (
                <div key={idx} style={{ background:'#0f172a', borderRadius:12, padding:14, marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                    <span style={{ fontWeight:700, fontSize:13, color:'#818cf8' }}>{v.label}</span>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:12, color:'#64748b' }}>{isAr?'الوزن:':'Weight:'}</span>
                      <input type="number" min="1" max="99" value={v.weight} onChange={e => {
                        const updated = [...form.variants];
                        updated[idx].weight = Number(e.target.value);
                        setForm({...form, variants:updated});
                      }} style={{ width:60, background:'#1e293b', border:'1px solid #334155', borderRadius:6, padding:'4px 8px', color:'#f1f5f9', fontSize:12 }} />
                      <span style={{ fontSize:12 }}>%</span>
                    </div>
                  </div>
                  <textarea className="input" rows={2} placeholder={isAr?`نص الرسالة ${String.fromCharCode(65+idx)}`:`Message ${String.fromCharCode(65+idx)} text`} value={v.message} onChange={e => {
                    const updated = [...form.variants];
                    updated[idx].message = e.target.value;
                    setForm({...form, variants:updated});
                  }} required />
                </div>
              ))}
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">{isAr?'إلغاء':'Cancel'}</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving?'...':(isAr?'إنشاء الاختبار':'Create Test')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
