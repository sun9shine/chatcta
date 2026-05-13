import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API = process.env.REACT_APP_API_URL || '/api';

export default function Conversions() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [data, setData] = useState({ conversions:[], total:0, totalValue:0 });
  const [byBot, setByBot] = useState([]);
  const [daily, setDaily] = useState([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('list');

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/conversions`).then(r => setData(r.data)),
      axios.get(`${API}/conversions/by-bot`).then(r => setByBot(r.data)),
      axios.get(`${API}/conversions/daily?days=${days}`).then(r => setDaily(r.data)),
    ]).finally(() => setLoading(false));
  }, [days]);

  const copyTrackingUrl = (trackingId) => {
    const url = `${window.location.origin}/track/${trackingId}`;
    navigator.clipboard.writeText(url);
  };

  if (loading) return <div style={{ padding:60, textAlign:'center', color:'#64748b' }}>...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>🎯 {isAr?'تتبع التحويلات':'Conversion Tracking'}</h1>
        <p style={{ color:'#64748b' }}>{isAr?'قياس أداء حملاتك التسويقية':'Measure your marketing campaign performance'}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-3" style={{ marginBottom:24 }}>
        {[
          { label:isAr?'إجمالي التحويلات':'Total Conversions', value:data.total, icon:'🎯', color:'#6366f1' },
          { label:isAr?'القيمة الإجمالية':'Total Value', value:`$${data.totalValue?.toFixed(2)||'0.00'}`, icon:'💰', color:'#10b981' },
          { label:isAr?'معدل التحويل':'Conversion Rate', value: data.total > 0 ? `${((data.total / Math.max(data.total, 1)) * 100).toFixed(1)}%` : '0%', icon:'📈', color:'#f59e0b' },
        ].map((s,i) => (
          <div key={i} className="stat-card">
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <div>
                <p style={{ fontSize:12, color:'#64748b', marginBottom:6 }}>{s.label}</p>
                <p style={{ fontSize:26, fontWeight:800, color:s.color }}>{s.value}</p>
              </div>
              <span style={{ fontSize:28 }}>{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        {['list','by-bot','chart'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`btn btn-sm ${tab===t?'btn-primary':'btn-outline'}`}>
            {t === 'list' ? (isAr?'القائمة':'List') : t === 'by-bot' ? (isAr?'حسب البوت':'By Bot') : (isAr?'الرسم':'Chart')}
          </button>
        ))}
      </div>

      {tab === 'list' && (
        <div className="card p-0">
          <div className="table-wrapper">
            <table>
              <thead><tr>
                <th>{isAr?'المرسل':'Sender'}</th>
                <th>{isAr?'المنصة':'Platform'}</th>
                <th>{isAr?'النوع':'Type'}</th>
                <th>{isAr?'القيمة':'Value'}</th>
                <th>{isAr?'التاريخ':'Date'}</th>
              </tr></thead>
              <tbody>
                {data.conversions.map(c => (
                  <tr key={c._id}>
                    <td style={{ fontSize:13 }}>{c.senderName || c.senderId || '-'}</td>
                    <td style={{ fontSize:12, color:'#94a3b8' }}>{c.platform || '-'}</td>
                    <td><span className="badge badge-primary" style={{ fontSize:10 }}>{c.eventType}</span></td>
                    <td style={{ fontWeight:700, color:'#10b981' }}>
                      {c.eventValue > 0 ? `$${c.eventValue.toFixed(2)}` : '-'}
                    </td>
                    <td style={{ fontSize:11, color:'#64748b' }}>
                      {new Date(c.createdAt).toLocaleDateString(isAr?'ar':'en')}
                    </td>
                  </tr>
                ))}
                {data.conversions.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign:'center', padding:40, color:'#64748b' }}>
                    {isAr?'لا توجد تحويلات بعد. أضف رابط التتبع لرسائل بوتاتك.':'No conversions yet. Add tracking links to your bot messages.'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'by-bot' && (
        <div className="card p-0">
          <div className="table-wrapper">
            <table>
              <thead><tr>
                <th>{isAr?'البوت':'Bot'}</th>
                <th>{isAr?'التحويلات':'Conversions'}</th>
                <th>{isAr?'القيمة':'Value'}</th>
              </tr></thead>
              <tbody>
                {byBot.map(b => (
                  <tr key={b._id||'unknown'}>
                    <td style={{ fontWeight:600 }}>{b.bot?.name || (isAr?'غير محدد':'Unknown')}</td>
                    <td style={{ fontWeight:700, color:'#6366f1' }}>{b.count}</td>
                    <td style={{ fontWeight:700, color:'#10b981' }}>${b.value?.toFixed(2)||'0.00'}</td>
                  </tr>
                ))}
                {byBot.length === 0 && <tr><td colSpan={3} style={{ textAlign:'center', padding:40, color:'#64748b' }}>{isAr?'لا بيانات':'No data'}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'chart' && (
        <>
          <div style={{ display:'flex', gap:8, marginBottom:16 }}>
            {[7,30,60,90].map(d => (
              <button key={d} onClick={() => setDays(d)} className={`btn btn-sm ${days===d?'btn-primary':'btn-outline'}`}>
                {d} {isAr?'يوم':'days'}
              </button>
            ))}
          </div>
          <div className="card">
            <h3 style={{ marginBottom:16, fontSize:15, fontWeight:600 }}>🎯 {isAr?'التحويلات اليومية':'Daily Conversions'}</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="_id" tick={{ fill:'#64748b', fontSize:10 }} />
                <YAxis tick={{ fill:'#64748b', fontSize:10 }} />
                <Tooltip contentStyle={{ background:'#1e293b', border:'1px solid #334155', borderRadius:8, fontSize:12 }} />
                <Bar dataKey="count" fill="#6366f1" radius={[4,4,0,0]} name={isAr?'التحويلات':'Conversions'} />
                <Bar dataKey="value" fill="#10b981" radius={[4,4,0,0]} name={isAr?'القيمة':'Value $'} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* How to track */}
      <div className="card" style={{ marginTop:20, background:'rgba(99,102,241,0.05)', border:'1px solid rgba(99,102,241,0.2)' }}>
        <h3 style={{ marginBottom:12, fontSize:15, fontWeight:600 }}>💡 {isAr?'كيف تتتبع التحويلات؟':'How to Track Conversions?'}</h3>
        <div style={{ fontSize:13, color:'#94a3b8', lineHeight:2 }}>
          <p>1. {isAr?'أضف معرف تتبع فريد في رسالة البوت: [trackingId: YOUR_ID]':'Add a unique tracking ID in your bot message: [trackingId: YOUR_ID]'}</p>
          <p>2. {isAr?'ضع صورة التتبع أو رابطها في صفحتك أو بريدك:':'Place the tracking pixel or link in your page or email:'}</p>
          <div style={{ background:'#0f172a', borderRadius:8, padding:'8px 14px', fontFamily:'monospace', fontSize:12, color:'#818cf8', marginTop:4 }}>
            {`<img src="${window.location.origin}/track/YOUR_TRACKING_ID" width="1" height="1" />`}
          </div>
          <p style={{ marginTop:8 }}>3. {isAr?'سيتم تسجيل التحويل تلقائياً عند زيارة الصفحة.':'Conversion will be automatically recorded when the page is visited.'}</p>
        </div>
      </div>
    </div>
  );
}
