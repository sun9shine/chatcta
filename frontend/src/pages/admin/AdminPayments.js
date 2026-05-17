import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = process.env.REACT_APP_API_URL || '/api';

const PROVIDERS = [
  { id: 'stripe', label: 'Stripe', icon: '💳', color: '#635BFF' },
  { id: 'paypal', label: 'PayPal', icon: '🅿️', color: '#003087' },
  { id: 'manual', label: 'Manual / Bank', icon: '🏦', color: '#10b981' },
  { id: 'custom', label: 'Custom API', icon: '⚙️', color: '#f59e0b' },
];

const emptyGW = { name: '', provider: 'stripe', isEnabled: false, paypal: { clientId: '', clientSecret: '', mode: 'sandbox' }, stripe: { publishableKey: '', secretKey: '', webhookSecret: '' }, custom: { instructions: '', instructionsAr: '', apiUrl: '', apiKey: '', webhookSecret: '' }, currencies: ['USD'] };

export default function AdminPayments() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [gateways, setGateways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ ...emptyGW });
  const [saving, setSaving] = useState(false);
  const [plans, setPlans] = useState({});
  const [enabledPlans, setEnabledPlans] = useState(['free', 'pro', 'enterprise']);
  const [planPrices, setPlanPrices] = useState({});
  const [savingPlans, setSavingPlans] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [gwRes, plansRes] = await Promise.all([
        axios.get(`${API}/payments/gateways`),
        axios.get(`${API}/payments/plans`)
      ]);
      setGateways(gwRes.data);
      setPlans(plansRes.data);
      const ep = []; const pp = {};
      Object.entries(plansRes.data).forEach(([k, v]) => { if (v.isEnabled) ep.push(k); pp[k] = v.price; });
      setEnabledPlans(ep); setPlanPrices(pp);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const openAdd = () => { setEditId(null); setForm({ ...emptyGW }); setShowModal(true); };
  const openEdit = (gw) => { setEditId(gw._id); setForm({ ...emptyGW, ...gw }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error(isAr ? 'أدخل اسم البوابة' : 'Enter gateway name');
    setSaving(true);
    try {
      if (editId) {
        const r = await axios.put(`${API}/payments/gateways/${editId}`, form);
        setGateways(prev => prev.map(g => g._id === editId ? r.data : g));
        toast.success(isAr ? 'تم التحديث' : 'Updated');
      } else {
        const r = await axios.post(`${API}/payments/gateways`, form);
        setGateways(prev => [...prev, r.data]);
        toast.success(isAr ? 'تم الإضافة' : 'Added');
      }
      setShowModal(false);
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
    finally { setSaving(false); }
  };

  const handleToggle = async (id) => {
    const r = await axios.put(`${API}/payments/gateways/${id}/toggle`);
    setGateways(prev => prev.map(g => g._id === id ? r.data : g));
  };

  const handleDelete = async (id) => {
    if (!window.confirm(isAr ? 'حذف هذه البوابة؟' : 'Delete this gateway?')) return;
    await axios.delete(`${API}/payments/gateways/${id}`);
    setGateways(prev => prev.filter(g => g._id !== id));
    toast.success(isAr ? 'تم الحذف' : 'Deleted');
  };

  const handleSavePlans = async () => {
    setSavingPlans(true);
    try {
      await axios.put(`${API}/payments/plans`, { enabledPlans, planPrices });
      toast.success(isAr ? 'تم حفظ إعدادات الخطط' : 'Plan settings saved');
    } catch (err) { toast.error('Error'); }
    finally { setSavingPlans(false); }
  };

  const provider = PROVIDERS.find(p => p.id === form.provider) || PROVIDERS[0];

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>...</div>;

  return (
    <div style={{ maxWidth: 900 }}>
      <div className="page-header flex-between">
        <div>
          <h1>💳 {isAr ? 'بوابات الدفع والاشتراكات' : 'Payment Gateways & Plans'}</h1>
          <p style={{ color: '#64748b', marginTop: 4 }}>{isAr ? 'أضف بوابات دفع وتحكم بالخطط' : 'Add payment gateways and manage plans'}</p>
        </div>
        <button onClick={openAdd} className="btn btn-primary">+ {isAr ? 'بوابة جديدة' : 'New Gateway'}</button>
      </div>

      {/* ── Plan Configuration ── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="flex-between" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>📋 {isAr ? 'إعدادات الخطط' : 'Plan Settings'}</h3>
          <button onClick={handleSavePlans} className="btn btn-sm btn-primary" disabled={savingPlans}>
            {savingPlans ? '...' : (isAr ? '💾 حفظ' : '💾 Save')}
          </button>
        </div>
        <div className="grid grid-3" style={{ gap: 12 }}>
          {['free', 'pro', 'enterprise'].map(planKey => (
            <div key={planKey} style={{ background: '#0f172a', borderRadius: 12, padding: 16, border: enabledPlans.includes(planKey) ? '1px solid rgba(99,102,241,0.4)' : '1px solid #334155' }}>
              <div className="flex-between" style={{ marginBottom: 10 }}>
                <span style={{ fontWeight: 700, fontSize: 14, textTransform: 'capitalize' }}>
                  {planKey === 'free' ? '🆓' : planKey === 'pro' ? '⚡' : '🏆'} {planKey}
                </span>
                <label className="switch" style={{ width: 36, height: 20 }}>
                  <input type="checkbox" checked={enabledPlans.includes(planKey)}
                    onChange={e => setEnabledPlans(prev => e.target.checked ? [...prev, planKey] : prev.filter(p => p !== planKey))} />
                  <span className="slider" style={{ borderRadius: 20 }}></span>
                </label>
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>{isAr ? 'السعر ($)' : 'Price ($)'}</label>
                <input className="input" type="number" min="0" step="1" value={planPrices[planKey] || 0}
                  onChange={e => setPlanPrices(prev => ({ ...prev, [planKey]: Number(e.target.value) }))} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Gateways List ── */}
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>🔌 {isAr ? 'بوابات الدفع' : 'Payment Gateways'}</h3>
      </div>

      {gateways.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', border: '1px dashed #334155', borderRadius: 14, color: '#475569' }}>
          <p style={{ fontSize: 36, marginBottom: 10 }}>💳</p>
          <p style={{ marginBottom: 16 }}>{isAr ? 'لا توجد بوابات دفع. أضف واحدة للبدء.' : 'No gateways. Add one to get started.'}</p>
          <button onClick={openAdd} className="btn btn-primary btn-sm">+ {isAr ? 'إضافة' : 'Add'}</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {gateways.map(gw => {
            const prov = PROVIDERS.find(p => p.id === gw.provider) || PROVIDERS[3];
            return (
              <div key={gw._id} className="card" style={{ border: gw.isEnabled ? '1px solid rgba(16,185,129,0.3)' : '1px solid #334155', opacity: gw.isEnabled ? 1 : 0.6 }}>
                <div className="flex-between">
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: 28 }}>{prov.icon}</span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 16 }}>{gw.name}</span>
                        <span className="badge" style={{ background: `${prov.color}22`, color: prov.color, fontSize: 10 }}>{prov.label}</span>
                        {gw.isEnabled ? <span className="badge badge-success" style={{ fontSize: 10 }}>{isAr ? 'مفعّل' : 'Active'}</span> : <span className="badge badge-danger" style={{ fontSize: 10 }}>{isAr ? 'معطّل' : 'Off'}</span>}
                      </div>
                      <p style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
                        {isAr ? 'عملات:' : 'Currencies:'} {(gw.currencies || []).join(', ')} | {isAr ? 'مدفوعات:' : 'Payments:'} {gw.totalPayments || 0} | ${gw.totalRevenue || 0}
                      </p>
                      <p style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                        Webhook: <code style={{ color: '#818cf8' }}>{gw.webhookUrl || `/webhook/payment/${gw.provider}`}</code>
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <label className="switch"><input type="checkbox" checked={gw.isEnabled} onChange={() => handleToggle(gw._id)} /><span className="slider"></span></label>
                    <button onClick={() => openEdit(gw)} className="btn btn-sm btn-outline">✏️</button>
                    <button onClick={() => handleDelete(gw._id)} className="btn btn-sm btn-danger">✕</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add/Edit Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 580 }}>
            <h3 className="modal-title">{editId ? (isAr ? '✏️ تعديل البوابة' : '✏️ Edit Gateway') : (isAr ? '➕ بوابة جديدة' : '➕ New Gateway')}</h3>

            <div className="grid grid-2" style={{ marginBottom: 14 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontSize: 13, color: '#94a3b8' }}>{isAr ? 'الاسم' : 'Name'}</label>
                <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={isAr ? 'مثال: Stripe USD' : 'e.g. Stripe USD'} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontSize: 13, color: '#94a3b8' }}>{isAr ? 'المزود' : 'Provider'}</label>
                <select className="input" value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value })}>
                  {PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.icon} {p.label}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', marginBottom: 5, fontSize: 13, color: '#94a3b8' }}>{isAr ? 'العملات' : 'Currencies'}</label>
              <input className="input" value={(form.currencies || []).join(', ')} onChange={e => setForm({ ...form, currencies: e.target.value.split(',').map(c => c.trim().toUpperCase()).filter(Boolean) })} placeholder="USD, EUR, SAR" />
            </div>

            {form.provider === 'stripe' && (
              <div style={{ background: '#0f172a', borderRadius: 10, padding: 14, marginBottom: 14 }}>
                <p style={{ fontSize: 12, color: '#818cf8', fontWeight: 700, marginBottom: 10 }}>💳 Stripe</p>
                <input className="input" placeholder="Publishable Key (pk_...)" value={form.stripe?.publishableKey || ''} onChange={e => setForm({ ...form, stripe: { ...form.stripe, publishableKey: e.target.value } })} style={{ marginBottom: 8 }} />
                <input className="input" placeholder="Secret Key (sk_...)" type="password" value={form.stripe?.secretKey || ''} onChange={e => setForm({ ...form, stripe: { ...form.stripe, secretKey: e.target.value } })} style={{ marginBottom: 8 }} />
                <input className="input" placeholder="Webhook Secret (whsec_...)" value={form.stripe?.webhookSecret || ''} onChange={e => setForm({ ...form, stripe: { ...form.stripe, webhookSecret: e.target.value } })} />
              </div>
            )}

            {form.provider === 'paypal' && (
              <div style={{ background: '#0f172a', borderRadius: 10, padding: 14, marginBottom: 14 }}>
                <p style={{ fontSize: 12, color: '#003087', fontWeight: 700, marginBottom: 10 }}>🅿️ PayPal</p>
                <input className="input" placeholder="Client ID" value={form.paypal?.clientId || ''} onChange={e => setForm({ ...form, paypal: { ...form.paypal, clientId: e.target.value } })} style={{ marginBottom: 8 }} />
                <input className="input" placeholder="Client Secret" type="password" value={form.paypal?.clientSecret || ''} onChange={e => setForm({ ...form, paypal: { ...form.paypal, clientSecret: e.target.value } })} style={{ marginBottom: 8 }} />
                <select className="input" value={form.paypal?.mode || 'sandbox'} onChange={e => setForm({ ...form, paypal: { ...form.paypal, mode: e.target.value } })}>
                  <option value="sandbox">Sandbox (Test)</option>
                  <option value="live">Live (Production)</option>
                </select>
              </div>
            )}

            {(form.provider === 'manual' || form.provider === 'custom') && (
              <div style={{ background: '#0f172a', borderRadius: 10, padding: 14, marginBottom: 14 }}>
                <p style={{ fontSize: 12, color: '#f59e0b', fontWeight: 700, marginBottom: 10 }}>{form.provider === 'manual' ? '🏦 Manual' : '⚙️ Custom'}</p>
                <textarea className="input" rows={2} placeholder={isAr ? 'تعليمات الدفع (عربي)' : 'Payment instructions (AR)'} value={form.custom?.instructionsAr || ''} onChange={e => setForm({ ...form, custom: { ...form.custom, instructionsAr: e.target.value } })} style={{ marginBottom: 8 }} />
                <textarea className="input" rows={2} placeholder="Payment instructions (EN)" value={form.custom?.instructions || ''} onChange={e => setForm({ ...form, custom: { ...form.custom, instructions: e.target.value } })} style={{ marginBottom: 8 }} />
                {form.provider === 'custom' && (
                  <>
                    <input className="input" placeholder="API URL" value={form.custom?.apiUrl || ''} onChange={e => setForm({ ...form, custom: { ...form.custom, apiUrl: e.target.value } })} style={{ marginBottom: 8 }} />
                    <input className="input" placeholder="API Key" value={form.custom?.apiKey || ''} onChange={e => setForm({ ...form, custom: { ...form.custom, apiKey: e.target.value } })} />
                  </>
                )}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <label className="switch"><input type="checkbox" checked={form.isEnabled} onChange={e => setForm({ ...form, isEnabled: e.target.checked })} /><span className="slider"></span></label>
              <span style={{ fontSize: 13 }}>{isAr ? 'مفعّل' : 'Enabled'}</span>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} className="btn btn-outline">{isAr ? 'إلغاء' : 'Cancel'}</button>
              <button onClick={handleSave} className="btn btn-primary" disabled={saving}>{saving ? '⏳' : (isAr ? '💾 حفظ' : '💾 Save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
