import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const API = process.env.REACT_APP_API_URL || '/api';
const COLORS = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b'];
const PLATFORM_EMOJI = { facebook:'📘', instagram:'📸', whatsapp:'💬', telegram:'✈️', tiktok:'🎵' };

export default function Analytics() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [overview, setOverview] = useState(null);
  const [botStats, setBotStats] = useState([]);
  const [pageStats, setPageStats] = useState([]);
  const [platformStats, setPlatformStats] = useState([]);
  const [growth, setGrowth] = useState(null);
  const [days, setDays] = useState(30);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/analytics/overview`).then(r => setOverview(r.data)),
      axios.get(`${API}/analytics/bots`).then(r => setBotStats(r.data)),
      axios.get(`${API}/analytics/pages`).then(r => setPageStats(r.data)),
      axios.get(`${API}/analytics/platforms`).then(r => setPlatformStats(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    axios.get(`${API}/analytics/growth?days=${days}`).then(r => setGrowth(r.data));
  }, [days]);

  if (loading) return <div style={{ padding:60, textAlign:'center', color:'#64748b' }}>...</div>;

  const StatCard = ({ icon, label, value, color='#6366f1', sub }) => (
    <div className="stat-card">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <p style={{ fontSize:12, color:'#64748b', marginBottom:6 }}>{label}</p>
          <p style={{ fontSize:28, fontWeight:800, color }}>{typeof value === 'number' ? value.toLocaleString() : value}</p>
          {sub && <p style={{ fontSize:11, color:'#475569', marginTop:4 }}>{sub}</p>}
        </div>
        <span style={{ fontSize:26 }}>{icon}</span>
      </div>
    </div>
  );

  const chartProps = {
    contentStyle: { background:'#1e293b', border:'1px solid #334155', color:'#f1f5f9', borderRadius:8, fontSize:12 }
  };

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1>📊 {isAr ? 'الإحصائيات المتقدمة' : 'Advanced Analytics'}</h1>
          <p style={{ color:'#64748b' }}>{isAr ? 'تحليل شامل لأداء المنصة' : 'Comprehensive performance analysis'}</p>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {['overview','bots','pages','growth'].map(t => (
            <button key={t} onClick={() => setTab(t)} className={`btn btn-sm ${tab===t?'btn-primary':'btn-outline'}`}>
              {t === 'overview' ? (isAr?'عام':'Overview') : t === 'bots' ? (isAr?'البوتات':'Bots') : t === 'pages' ? (isAr?'الصفحات':'Pages') : (isAr?'النمو':'Growth')}
            </button>
          ))}
        </div>
      </div>

      {/* Overview */}
      {tab === 'overview' && overview && (
        <>
          <div className="grid grid-4" style={{ marginBottom:24 }}>
            <StatCard icon="💬" label={isAr?'إجمالي الرسائل':'Total Messages'} value={overview.totalMessages} />
            <StatCard icon="🗨️" label={isAr?'إجمالي التعليقات':'Total Comments'} value={overview.totalComments} color="#8b5cf6" />
            <StatCard icon="✅" label={isAr?'ردود تلقائية':'Auto Replies'} value={overview.autoReplies} color="#10b981" />
            <StatCard icon="🎯" label={isAr?'التحويلات':'Conversions'} value={overview.totalConversions} color="#f59e0b" sub={`$${(overview.totalValue||0).toFixed(2)}`} />
          </div>
          <div className="grid grid-2">
            <div className="card">
              <h3 style={{ marginBottom:16, fontSize:15, fontWeight:600 }}>💬 {isAr?'الرسائل (7 أيام)':'Messages (7 days)'}</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={overview.dailyMessages}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="_id" tick={{ fill:'#64748b', fontSize:10 }} />
                  <YAxis tick={{ fill:'#64748b', fontSize:10 }} />
                  <Tooltip {...chartProps} />
                  <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <h3 style={{ marginBottom:16, fontSize:15, fontWeight:600 }}>🗨️ {isAr?'التعليقات (7 أيام)':'Comments (7 days)'}</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={overview.dailyComments}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="_id" tick={{ fill:'#64748b', fontSize:10 }} />
                  <YAxis tick={{ fill:'#64748b', fontSize:10 }} />
                  <Tooltip {...chartProps} />
                  <Line type="monotone" dataKey="count" stroke="#06b6d4" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Platform breakdown */}
          {platformStats.length > 0 && (
            <div className="card" style={{ marginTop:20 }}>
              <h3 style={{ marginBottom:16, fontSize:15, fontWeight:600 }}>🌐 {isAr?'توزيع المنصات':'Platform Breakdown'}</h3>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12 }}>
                {platformStats.map(p => (
                  <div key={p.platform} style={{ textAlign:'center', padding:'16px 8px', background:'#0f172a', borderRadius:12 }}>
                    <div style={{ fontSize:28, marginBottom:6 }}>{PLATFORM_EMOJI[p.platform]}</div>
                    <div style={{ fontSize:12, color:'#94a3b8', marginBottom:4 }}>{p.platform}</div>
                    <div style={{ fontSize:16, fontWeight:700 }}>{p.messages}</div>
                    <div style={{ fontSize:11, color:'#64748b' }}>{isAr?'رسالة':'msgs'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Bots */}
      {tab === 'bots' && (
        <div className="card p-0">
          <div className="table-wrapper">
            <table>
              <thead><tr>
                <th>{isAr?'البوت':'Bot'}</th>
                <th>{isAr?'المنصة':'Platform'}</th>
                <th>{isAr?'الردود':'Replies'}</th>
                <th>{isAr?'الرسائل':'DMs'}</th>
                <th>{isAr?'التحويلات':'Conversions'}</th>
                <th>{isAr?'القيمة':'Value'}</th>
                <th>{isAr?'آخر تشغيل':'Last Run'}</th>
              </tr></thead>
              <tbody>
                {botStats.map(b => (
                  <tr key={b.botId}>
                    <td>
                      <div style={{ fontWeight:600, fontSize:14 }}>{b.name}</div>
                      <div style={{ fontSize:11, color:'#64748b' }}>{b.type}</div>
                    </td>
                    <td><span style={{ fontSize:18 }}>{PLATFORM_EMOJI[b.platform]||'🤖'}</span></td>
                    <td><span style={{ fontWeight:700, color:'#6366f1' }}>{b.replies}</span></td>
                    <td><span style={{ fontWeight:700, color:'#8b5cf6' }}>{b.dms}</span></td>
                    <td><span style={{ fontWeight:700, color:'#10b981' }}>{b.conversions}</span></td>
                    <td><span style={{ fontWeight:700, color:'#f59e0b' }}>${b.conversionValue?.toFixed(2)||'0.00'}</span></td>
                    <td style={{ fontSize:12, color:'#64748b' }}>
                      {b.lastRun ? new Date(b.lastRun).toLocaleDateString(isAr?'ar':'en') : '-'}
                    </td>
                  </tr>
                ))}
                {botStats.length === 0 && <tr><td colSpan={7} style={{ textAlign:'center', padding:40, color:'#64748b' }}>{isAr?'لا توجد بيانات':'No data'}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pages */}
      {tab === 'pages' && (
        <>
          <div className="grid grid-2" style={{ marginBottom:20 }}>
            {pageStats.map(p => (
              <div key={p.pageId} className="card">
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
                  <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                    <span style={{ fontSize:24 }}>{PLATFORM_EMOJI[p.platform]}</span>
                    <div>
                      <p style={{ fontWeight:700 }}>{p.pageName}</p>
                      <p style={{ fontSize:12, color:'#64748b' }}>{p.followers?.toLocaleString()} {isAr?'متابع':'followers'}</p>
                    </div>
                  </div>
                  <div style={{ textAlign:'center' }}>
                    <div style={{ fontSize:22, fontWeight:800, color:'#10b981' }}>{p.replyRate}%</div>
                    <div style={{ fontSize:11, color:'#64748b' }}>{isAr?'معدل الرد':'Reply Rate'}</div>
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, textAlign:'center' }}>
                  {[
                    { label:isAr?'وارد':'In', value:p.inMessages, color:'#6366f1' },
                    { label:isAr?'صادر':'Out', value:p.outMessages, color:'#8b5cf6' },
                    { label:isAr?'تعليقات':'Comments', value:p.comments, color:'#06b6d4' },
                    { label:isAr?'ردود':'Replied', value:p.replied, color:'#10b981' },
                  ].map(s => (
                    <div key={s.label} style={{ background:'#0f172a', borderRadius:10, padding:'10px 4px' }}>
                      <div style={{ fontSize:18, fontWeight:800, color:s.color }}>{s.value}</div>
                      <div style={{ fontSize:10, color:'#64748b', marginTop:2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Growth */}
      {tab === 'growth' && growth && (
        <>
          <div style={{ display:'flex', gap:8, marginBottom:20 }}>
            {[7,30,60,90].map(d => (
              <button key={d} onClick={() => setDays(d)} className={`btn btn-sm ${days===d?'btn-primary':'btn-outline'}`}>
                {d} {isAr?'يوم':'days'}
              </button>
            ))}
          </div>
          <div className="grid grid-2">
            <div className="card">
              <h3 style={{ marginBottom:16, fontSize:15, fontWeight:600 }}>💬 {isAr?'نمو الرسائل':'Message Growth'}</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={growth.msgGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="_id" tick={{ fill:'#64748b', fontSize:9 }} />
                  <YAxis tick={{ fill:'#64748b', fontSize:10 }} />
                  <Tooltip {...chartProps} />
                  <Bar dataKey="count" fill="#6366f1" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <h3 style={{ marginBottom:16, fontSize:15, fontWeight:600 }}>🎯 {isAr?'نمو التحويلات':'Conversion Growth'}</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={growth.convGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="_id" tick={{ fill:'#64748b', fontSize:9 }} />
                  <YAxis tick={{ fill:'#64748b', fontSize:10 }} />
                  <Tooltip {...chartProps} />
                  <Bar dataKey="count" fill="#10b981" radius={[4,4,0,0]} />
                  <Bar dataKey="value" fill="#f59e0b" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
