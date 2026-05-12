import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || '/api';

export default function AdminDashboard() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/admin/stats`).then(r => setStats(r.data)).finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: isAr ? 'إجمالي المستخدمين' : 'Total Users', value: stats.users || 0, icon: '👥', color: '#6366f1' },
    { label: isAr ? 'إجمالي الصفحات' : 'Total Pages', value: stats.pages || 0, icon: '🔗', color: '#8b5cf6' },
    { label: isAr ? 'إجمالي البوتات' : 'Total Bots', value: stats.bots || 0, icon: '🤖', color: '#06b6d4' },
    { label: isAr ? 'إجمالي الرسائل' : 'Total Messages', value: stats.messages || 0, icon: '💬', color: '#10b981' },
    { label: isAr ? 'إجمالي التعليقات' : 'Total Comments', value: stats.comments || 0, icon: '🗨️', color: '#f59e0b' },
  ];

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>{isAr ? 'لوحة تحكم الأدمن' : 'Admin Dashboard'}</h1>
        <p style={{ color: '#64748b' }}>{isAr ? 'نظرة شاملة على المنصة' : 'Complete platform overview'}</p>
      </div>
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        {cards.map((c, i) => (
          <div key={i} className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>{c.label}</p>
                <p style={{ fontSize: 32, fontWeight: 800, color: c.color }}>{c.value.toLocaleString()}</p>
              </div>
              <span style={{ fontSize: 28 }}>{c.icon}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="card">
        <h3 style={{ marginBottom: 12, fontSize: 16, fontWeight: 600 }}>🛡️ {isAr ? 'معلومات الأدمن' : 'Admin Info'}</h3>
        <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.8 }}>
          {isAr
            ? '• من هنا يمكنك إدارة المستخدمين، تفعيل المنصات، إعداد البريد الإلكتروني، نشر الإعلانات، وتصدير البيانات.'
            : '• From here you can manage users, enable platforms, configure email, publish announcements, and export data.'}
        </p>
      </div>
    </div>
  );
}
