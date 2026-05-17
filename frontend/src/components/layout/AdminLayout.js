import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../store/authStore';

const adminNav = [
  { to: '/admin', label: 'dashboard', icon: '📊', exact: true },
  { to: '/admin/users', label: 'users', icon: '👥' },
  { to: '/admin/subscriptions', labelAr: 'الاشتراكات', labelEn: 'Subscriptions', icon: '💎' },
  { to: '/admin/platforms', label: 'platforms', icon: '🔌' },
  { to: '/admin/smtp', label: 'smtp', icon: '📧' },
  { to: '/admin/announcements', label: 'announcements', icon: '📢' },
  { to: '/admin/notifications', labelAr: 'الإشعارات', labelEn: 'Notifications', icon: '🔔' },
  { to: '/admin/privacy', label: 'privacy', icon: '🔒' },
  { to: '/admin/publish', label: 'publish', icon: '📤' },
  { to: '/admin/support', label: 'support', icon: '🎧' },
  { to: '/admin/templates', labelAr: 'القوالب', labelEn: 'Templates', icon: '📋' },
  { to: '/admin/ai-settings', labelAr: 'إعدادات الذكاء الاصطناعي', labelEn: 'AI Settings', icon: '🧠' },
  { to: '/admin/payments', labelAr: 'بوابات الدفع', labelEn: 'Payments', icon: '💳' },
  { to: '/admin/data-export', label: 'dataExport', icon: '📁' },
  { to: '/admin/credentials', label: 'settings', icon: '⚙️' },
];

export default function AdminLayout() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const isAr = i18n.language === 'ar';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a' }}>
      <aside style={{
        width: open ? 240 : 68, transition: 'width 0.3s',
        background: 'linear-gradient(180deg,#1e1b4b,#1e293b)',
        borderRight: isAr ? 'none' : '1px solid #334155',
        borderLeft: isAr ? '1px solid #334155' : 'none',
        display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', flexShrink: 0
      }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: open ? 'space-between' : 'center' }}>
          {open && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>🛡️</span>
              <span style={{ fontWeight: 800, fontSize: 15, color: '#818cf8' }}>{isAr ? 'لوحة الأدمن' : 'Admin Panel'}</span>
            </div>
          )}
          <button onClick={() => setOpen(!open)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 18 }}>
            {open ? '◀' : '▶'}
          </button>
        </div>
        <nav style={{ flex: 1, padding: '12px 10px', overflow: 'auto' }}>
          {adminNav.map(item => {
            const label = item.label ? t(item.label) : (isAr ? item.labelAr : item.labelEn);
            return (
              <NavLink key={item.to} to={item.to} end={item.exact}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                style={{ justifyContent: open ? 'flex-start' : 'center', marginBottom: 2 }}
                title={!open ? label : ''}>
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                {open && <span style={{ fontSize: 13 }}>{label}</span>}
              </NavLink>
            );
          })}
        </nav>
        <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button onClick={() => navigate('/dashboard')} className="sidebar-link" style={{ width: '100%', background: 'none', border: 'none', justifyContent: open ? 'flex-start' : 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 18 }}>👤</span>
            {open && <span>{isAr ? 'حساب المستخدم' : 'User Account'}</span>}
          </button>
          <button onClick={() => { logout(); navigate('/login'); }} className="sidebar-link" style={{ width: '100%', background: 'none', border: 'none', justifyContent: open ? 'flex-start' : 'center', color: '#ef4444' }}>
            <span style={{ fontSize: 18 }}>🚪</span>
            {open && <span>{t('logout')}</span>}
          </button>
        </div>
      </aside>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{ padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #334155', background: 'rgba(30,27,75,0.5)' }}>
          <span style={{ fontSize: 13, color: '#64748b' }}>👋 {isAr ? `مرحباً` : `Hello`}, <strong style={{ color: '#f1f5f9' }}>{user?.name}</strong></span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { const n = isAr ? 'en' : 'ar'; i18n.changeLanguage(n); document.documentElement.dir = n === 'ar' ? 'rtl' : 'ltr'; }} className="btn btn-outline btn-sm">{isAr ? 'EN' : 'عربي'}</button>
          </div>
        </header>
        <main style={{ flex: 1, padding: 24, overflow: 'auto' }} className="animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
