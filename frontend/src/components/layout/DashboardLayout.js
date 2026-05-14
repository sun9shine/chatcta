import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../store/authStore';

const navItems = [
  { to: '/dashboard',              label: 'dashboard',      icon: '🏠', exact: true },
  { to: '/dashboard/pages',        label: 'connectedPages', icon: '🔗' },
  { to: '/dashboard/bots',         label: 'bots',           icon: '🤖' },
  { to: '/dashboard/templates',    labelAr: 'قوالب',                     labelEn: 'Templates',     icon: '📋' },
  { to: '/dashboard/message-flow', label: 'messageFlow',    icon: '💬' },
  { to: '/dashboard/comment-flow', label: 'commentFlow',    icon: '🗨️' },
  { to: '/dashboard/scheduled',    labelAr: 'جدولة المنشورات',           labelEn: 'Scheduled',     icon: '📅' },
  { to: '/dashboard/analytics',    labelAr: 'الإحصائيات',               labelEn: 'Analytics',     icon: '📊' },
  { to: '/dashboard/ab-tests',     labelAr: 'A/B اختبار',               labelEn: 'A/B Tests',     icon: '⚡' },
  { to: '/dashboard/conversions',  labelAr: 'التحويلات',                labelEn: 'Conversions',   icon: '🎯' },
  { to: '/dashboard/team',         labelAr: 'الفريق',                   labelEn: 'Team',          icon: '👥' },
  { to: '/dashboard/subscription', labelAr: 'الاشتراك',                 labelEn: 'Subscription',  icon: '💎' },
  { to: '/dashboard/ai-settings',  labelAr: 'إعدادات الذكاء الاصطناعي', labelEn: 'AI Settings',  icon: '🧠' },
  { to: '/dashboard/support',      label: 'support',        icon: '🎧' },
  { to: '/dashboard/profile',      label: 'profile',        icon: '👤' },
];

export default function DashboardLayout() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isAr = i18n.language === 'ar';

  const handleLogout = () => { logout(); navigate('/login'); };
  const toggleLang = () => {
    const newLang = isAr ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a' }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? 240 : 64, transition: 'width 0.3s', background: '#1e293b',
        borderRight: '1px solid #334155', display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh', flexShrink: 0,
        ...(isAr ? { borderRight: 'none', borderLeft: '1px solid #334155' } : {})
      }}>
        {/* Logo */}
        <div style={{ padding: '18px 14px', borderBottom: '1px solid #334155',
          display: 'flex', alignItems: 'center', justifyContent: sidebarOpen ? 'space-between' : 'center' }}>
          {sidebarOpen && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8,
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>💬</div>
              <span style={{ fontWeight: 800, fontSize: 15,
                background: 'linear-gradient(135deg,#818cf8,#c084fc)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ChatCTA</span>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 8px', overflow: 'auto' }}>
          {navItems.map(item => {
            const label = item.label ? t(item.label) : (isAr ? item.labelAr : item.labelEn);
            return (
              <NavLink key={item.to} to={item.to} end={item.exact}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                style={{ justifyContent: sidebarOpen ? 'flex-start' : 'center', marginBottom: 2 }}
                title={!sidebarOpen ? label : ''}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                {sidebarOpen && <span style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '10px 8px', borderTop: '1px solid #334155' }}>
          {sidebarOpen && user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px', marginBottom: 6 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8,
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                {user.name?.[0]?.toUpperCase()}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
                <div style={{ fontSize: 11, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
              </div>
            </div>
          )}
          <button onClick={handleLogout} className="sidebar-link"
            style={{ width: '100%', background: 'none', border: 'none',
              justifyContent: sidebarOpen ? 'flex-start' : 'center', color: '#ef4444' }}>
            <span style={{ fontSize: 16 }}>🚪</span>
            {sidebarOpen && <span style={{ fontSize: 13 }}>{t('logout')}</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{ padding: '0 20px', height: 56, display: 'flex', alignItems: 'center',
          justifyContent: 'flex-end', borderBottom: '1px solid #334155', background: '#1e293b', gap: 10 }}>
          <button onClick={toggleLang} className="btn btn-outline btn-sm">{isAr ? 'EN' : 'عربي'}</button>
          {user?.role === 'admin' && (
            <button onClick={() => navigate('/admin')} className="btn btn-primary btn-sm">
              {isAr ? '🛡️ الأدمن' : '🛡️ Admin'}
            </button>
          )}
        </header>
        <main style={{ flex: 1, padding: 22, overflow: 'auto' }} className="animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
