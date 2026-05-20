import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import { useAuth } from '../../store/authStore';

const API = process.env.REACT_APP_API_URL || '/api';

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAr = i18n.language === 'ar';
  const [stats, setStats] = useState({});
  const [analytics, setAnalytics] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      axios.get(`${API}/users/stats`).then(r => setStats(r.data)),
      axios.get(`${API}/analytics/overview`).then(r => setAnalytics(r.data)),
      axios.get(`${API}/announcements`).then(r => setAnnouncements(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: t('totalPages'), value: stats.pages || 0, icon: '🔗', color: '#6366f1' },
    { label: t('activeBots'), value: stats.bots || 0, icon: '🤖', color: '#8b5cf6' },
    { label: t('autoReplies'), value: stats.autoComments || 0, icon: '💬', color: '#06b6d4' },
    { label: t('autoMessages'), value: stats.autoMessages || 0, icon: '📩', color: '#10b981' },
  ];

  if (loading) return <div style={{ textAlign: 'center', padding: 60 }}><p style={{ color: '#64748b' }}>{t('loading')}</p></div>;

  return (
    <div>
      <div className="page-header">
        <h1>{t('dashboard')}</h1>
        <p style={{ color: '#64748b' }}>{isAr ? 'نظرة عامة على أداء منصتك' : 'Overview of your platform performance'}</p>
      </div>

      {/* Announcements */}
      {announcements.filter(a => !a.readBy?.includes(user?._id)).slice(0, 3).map(ann => (
        <div key={ann._id} style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 12, padding: '14px 18px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong style={{ fontSize: 14 }}>{isAr && ann.titleAr ? ann.titleAr : ann.title}</strong>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>{isAr && ann.contentAr ? ann.contentAr : ann.content}</p>
          </div>
          <button onClick={() => { axios.put(`${API}/announcements/${ann._id}/read`); setAnnouncements(prev => prev.filter(a => a._id !== ann._id)); }} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>
      ))}

      {/* Stat Cards */}
      <div className="grid grid-4" style={{ marginBottom: 28 }}>
        {statCards.map((s, i) => (
          <div key={i} className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>{s.label}</p>
                <p style={{ fontSize: 32, fontWeight: 800, color: s.color }}>{s.value.toLocaleString()}</p>
              </div>
              <div style={{ fontSize: 28 }}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      {analytics && (
        <div className="grid grid-2">
          <div className="card">
            <h3 style={{ marginBottom: 20, fontSize: 16, fontWeight: 600 }}>{isAr ? 'الرسائل (7 أيام)' : 'Messages (7 days)'}</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={analytics.dailyMessages}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="_id" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', color: '#f1f5f9' }} />
                <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h3 style={{ marginBottom: 20, fontSize: 16, fontWeight: 600 }}>{isAr ? 'التعليقات (7 أيام)' : 'Comments (7 days)'}</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={analytics.dailyComments}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="_id" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', color: '#f1f5f9' }} />
                <Line type="monotone" dataKey="count" stroke="#06b6d4" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600 }}>{isAr ? 'إجراءات سريعة' : 'Quick Actions'}</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/dashboard/pages')} className="btn btn-outline">{isAr ? '🔗 ربط صفحة' : '🔗 Connect Page'}</button>
          <button onClick={() => navigate('/dashboard/bots/new')} className="btn btn-outline">{isAr ? '🤖 إنشاء بوت' : '🤖 Create Bot'}</button>
          <button onClick={() => navigate('/dashboard/message-flow')} className="btn btn-outline">{isAr ? '💬 تدفق الرسائل' : '💬 Message Flow'}</button>
          <button onClick={() => navigate('/dashboard/support')} className="btn btn-outline">{isAr ? '🎧 الدعم الفني' : '🎧 Support'}</button>
        </div>
      </div>
    </div>
  );
}
