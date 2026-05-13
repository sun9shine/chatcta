import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = process.env.REACT_APP_API_URL || '/api';
const PLAN_COLORS = { free:'#64748b', pro:'#6366f1', enterprise:'#f59e0b' };
const PLAN_ICONS  = { free:'🆓', pro:'⚡', enterprise:'🏆' };

export default function AdminSubscriptions() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [subs, setSubs]   = useState([]);
  const [plans, setPlans] = useState({});
  const [loading, setLoading] = useState(true);
  const [modal, setModal]   = useState(null); // { userId, name, email, plan }
  const [form, setForm]     = useState({ plan:'pro', expiresAt:'', adminNote:'' });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState('');

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/subscriptions/admin/all`).then(r => setSubs(r.data)),
      axios.get(`${API}/subscriptions/plans`).then(r => setPlans(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  const handleUpgrade = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await axios.put(`${API}/admin/users/${modal.userId}/upgrade`, form);
      setSubs(prev => prev.map(s => s.userId?._id === modal.userId
        ? { ...s, plan: form.plan, upgradedByAdmin: true, expiresAt: form.expiresAt || null }
        : s
      ));
      toast.success(isAr ? `تم ترقية ${modal.name} إلى ${form.plan}` : `${modal.name} upgraded to ${form.plan}`);
      setModal(null);
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
    finally { setSaving(false); }
  };

  const filtered = subs.filter(s => {
    const name = s.userId?.name?.toLowerCase() || '';
    const email = s.userId?.email?.toLowerCase() || '';
    const q = search.toLowerCase();
    const matchSearch = !q || name.includes(q) || email.includes(q);
    const matchPlan = !filterPlan || s.plan === filterPlan;
    return matchSearch && matchPlan;
  });

  const counts = { free: subs.filter(s=>s.plan==='free').length, pro: subs.filter(s=>s.plan==='pro').length, enterprise: subs.filter(s=>s.plan==='enterprise').length };

  if (loading) return <div style={{ padding:60, textAlign:'center', color:'#64748b' }}>...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>💎 {isAr ? 'إدارة الاشتراكات' : 'Subscription Management'}</h1>
        <p style={{ color:'#64748b' }}>{isAr ? 'ترقية وإدارة خطط المستخدمين' : 'Upgrade and manage user plans'}</p>
      </div>

      {/* Plan counts */}
      <div className="grid grid-3" style={{ marginBottom:24 }}>
        {Object.entries(counts).map(([plan, count]) => (
          <div key={plan} className="stat-card" style={{ cursor:'pointer', borderColor: filterPlan===plan ? PLAN_COLORS[plan] : undefined }}
            onClick={() => setFilterPlan(filterPlan === plan ? '' : plan)}>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <div>
                <p style={{ fontSize:12, color:'#64748b', marginBottom:6 }}>{isAr ? plans[plan]?.nameAr : plans[plan]?.name}</p>
                <p style={{ fontSize:32, fontWeight:900, color:PLAN_COLORS[plan] }}>{count}</p>
              </div>
              <span style={{ fontSize:32 }}>{PLAN_ICONS[plan]}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Search & filter */}
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <input className="input" placeholder={isAr?'بحث...':'Search...'} value={search}
          onChange={e => setSearch(e.target.value)} style={{ flex:1, minWidth:200 }} />
        {['','free','pro','enterprise'].map(p => (
          <button key={p} onClick={() => setFilterPlan(p)}
            className={`btn btn-sm ${filterPlan===p?'btn-primary':'btn-outline'}`}
            style={p && filterPlan===p ? { borderColor:PLAN_COLORS[p] } : {}}>
            {p ? `${PLAN_ICONS[p]} ${p}` : (isAr?'الكل':'All')}
          </button>
        ))}
      </div>

      <div className="card p-0">
        <div className="table-wrapper">
          <table>
            <thead><tr>
              <th>{isAr?'المستخدم':'User'}</th>
              <th>{isAr?'الخطة':'Plan'}</th>
              <th>{isAr?'طريقة الترقية':'Upgrade Method'}</th>
              <th>{isAr?'تاريخ الانتهاء':'Expires'}</th>
              <th>{isAr?'ملاحظة الأدمن':'Admin Note'}</th>
              <th>{isAr?'الإجراء':'Action'}</th>
            </tr></thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s._id}>
                  <td>
                    <div style={{ fontWeight:600, fontSize:14 }}>{s.userId?.name || '—'}</div>
                    <div style={{ fontSize:12, color:'#64748b' }}>{s.userId?.email}</div>
                  </td>
                  <td>
                    <span className="badge" style={{ background:`${PLAN_COLORS[s.plan]}22`, color:PLAN_COLORS[s.plan], fontSize:12 }}>
                      {PLAN_ICONS[s.plan]} {s.plan}
                    </span>
                  </td>
                  <td>
                    {s.upgradedByAdmin
                      ? <span className="badge" style={{ background:'rgba(99,102,241,0.15)', color:'#818cf8' }}>🛡️ {isAr?'أدمن':'Admin'}</span>
                      : <span className="badge badge-success">{isAr?'مدفوع':'Paid'}</span>}
                  </td>
                  <td style={{ fontSize:12, color:'#64748b' }}>
                    {s.expiresAt ? new Date(s.expiresAt).toLocaleDateString(isAr?'ar':'en') : (isAr?'لا نهاية':'Never')}
                  </td>
                  <td style={{ fontSize:12, color:'#94a3b8', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {s.adminNote || '-'}
                  </td>
                  <td>
                    <button
                      onClick={() => {
                        setModal({ userId: s.userId?._id, name: s.userId?.name, email: s.userId?.email, currentPlan: s.plan });
                        setForm({ plan: s.plan === 'enterprise' ? 'pro' : 'enterprise', expiresAt:'', adminNote:'' });
                      }}
                      className="btn btn-sm btn-primary"
                    >
                      💎 {isAr?'تعديل الخطة':'Change Plan'}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign:'center', padding:40, color:'#64748b' }}>
                  {isAr?'لا توجد نتائج':'No results'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upgrade Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{ maxWidth:460 }}>
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <p style={{ fontSize:32, marginBottom:8 }}>💎</p>
              <h3 style={{ fontSize:17, fontWeight:700 }}>
                {isAr ? `تعديل خطة ${modal.name}` : `Change ${modal.name}'s Plan`}
              </h3>
              <p style={{ fontSize:12, color:'#64748b' }}>{modal.email}</p>
              <p style={{ marginTop:6, fontSize:13 }}>
                {isAr?'الخطة الحالية:':'Current plan:'}{' '}
                <span style={{ color:PLAN_COLORS[modal.currentPlan], fontWeight:700 }}>
                  {PLAN_ICONS[modal.currentPlan]} {modal.currentPlan}
                </span>
              </p>
            </div>

            <div style={{ background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:10, padding:'10px 14px', marginBottom:20, fontSize:12, color:'#10b981' }}>
              ✅ {isAr?'هذه الترقية مجانية - لا تحتاج لدفع من المستخدم':'This upgrade is FREE - no payment required from user'}
            </div>

            <form onSubmit={handleUpgrade}>
              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', marginBottom:6, fontSize:13, color:'#94a3b8' }}>{isAr?'الخطة الجديدة':'New Plan'}</label>
                <div className="grid grid-3" style={{ gap:10 }}>
                  {['free','pro','enterprise'].map(p => (
                    <div key={p} onClick={() => setForm({...form, plan:p})} style={{
                      padding:'14px 10px', borderRadius:12, textAlign:'center', cursor:'pointer',
                      border:`2px solid ${form.plan===p ? PLAN_COLORS[p] : '#334155'}`,
                      background: form.plan===p ? `${PLAN_COLORS[p]}15` : 'transparent',
                      transition:'all 0.2s'
                    }}>
                      <div style={{ fontSize:24 }}>{PLAN_ICONS[p]}</div>
                      <div style={{ fontWeight:700, fontSize:13, color:PLAN_COLORS[p], marginTop:4 }}>{p}</div>
                      <div style={{ fontSize:11, color:'#64748b' }}>${plans[p]?.price || 0}/mo</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', marginBottom:6, fontSize:13, color:'#94a3b8' }}>
                  {isAr?'تاريخ الانتهاء (اتركه فارغاً للأبد)':'Expiry date (leave empty for never)'}
                </label>
                <input className="input" type="date" value={form.expiresAt} onChange={e=>setForm({...form,expiresAt:e.target.value})} />
              </div>
              <div style={{ marginBottom:20 }}>
                <label style={{ display:'block', marginBottom:6, fontSize:13, color:'#94a3b8' }}>{isAr?'ملاحظة (اختياري)':'Note (optional)'}</label>
                <input className="input" value={form.adminNote} onChange={e=>setForm({...form,adminNote:e.target.value})}
                  placeholder={isAr?'مثال: هدية من الشركة':'e.g., Company gift'} />
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button type="button" onClick={() => setModal(null)} className="btn btn-outline">{isAr?'إلغاء':'Cancel'}</button>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{ background:`linear-gradient(135deg,${PLAN_COLORS[form.plan]},${PLAN_COLORS[form.plan]}cc)` }}>
                  {saving ? '...' : `${PLAN_ICONS[form.plan]} ${isAr?`ترقية إلى ${form.plan}`:`Upgrade to ${form.plan}`}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
