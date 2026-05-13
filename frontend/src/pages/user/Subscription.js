import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../store/authStore';

const API = process.env.REACT_APP_API_URL || '/api';

const PLAN_COLORS = { free: '#64748b', pro: '#6366f1', enterprise: '#f59e0b' };
const PLAN_ICONS  = { free: '🆓', pro: '⚡', enterprise: '🏆' };

export default function Subscription() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { user } = useAuth();
  const [sub, setSub]     = useState(null);
  const [plans, setPlans] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/subscriptions/my`).then(r => setSub(r.data)),
      axios.get(`${API}/subscriptions/plans`).then(r => setPlans(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding:60, textAlign:'center', color:'#64748b' }}>...</div>;

  const current = sub?.plan || 'free';
  const planDetails = plans[current] || {};

  const Limit = ({ label, value }) => (
    <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #334155', fontSize:13 }}>
      <span style={{ color:'#94a3b8' }}>{label}</span>
      <span style={{ fontWeight:700, color: value === -1 || value === true ? '#10b981' : value === false ? '#ef4444' : '#f1f5f9' }}>
        {value === -1 ? '∞' : value === true ? '✓' : value === false ? '✕' : value}
      </span>
    </div>
  );

  return (
    <div style={{ maxWidth:900 }}>
      <div className="page-header">
        <h1>💎 {isAr ? 'الاشتراك والخطة' : 'Subscription & Plan'}</h1>
        <p style={{ color:'#64748b' }}>{isAr ? 'خطتك الحالية وحدود الاستخدام' : 'Your current plan and usage limits'}</p>
      </div>

      {/* Current plan banner */}
      <div className="card" style={{ marginBottom:24, background:`linear-gradient(135deg,${PLAN_COLORS[current]}22,${PLAN_COLORS[current]}11)`, border:`1px solid ${PLAN_COLORS[current]}44` }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ fontSize:48 }}>{PLAN_ICONS[current]}</div>
            <div>
              <div style={{ fontSize:24, fontWeight:900, color:PLAN_COLORS[current] }}>
                {isAr ? planDetails.nameAr : planDetails.name} Plan
              </div>
              <div style={{ fontSize:13, color:'#94a3b8', marginTop:4 }}>
                {sub?.upgradedByAdmin
                  ? (isAr ? '✨ مُرقَّى بواسطة الأدمن' : '✨ Upgraded by Admin')
                  : (isAr ? 'خطتك الحالية' : 'Your current plan')}
              </div>
              {sub?.expiresAt && (
                <div style={{ fontSize:12, color:'#f59e0b', marginTop:4 }}>
                  {isAr ? 'تنتهي:' : 'Expires:'} {new Date(sub.expiresAt).toLocaleDateString(isAr?'ar':'en')}
                </div>
              )}
            </div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:36, fontWeight:900, color:PLAN_COLORS[current] }}>
              ${planDetails.price || 0}
            </div>
            <div style={{ fontSize:12, color:'#64748b' }}>{isAr ? '/شهر' : '/month'}</div>
          </div>
        </div>
        {sub?.adminNote && (
          <div style={{ marginTop:12, padding:'8px 14px', background:'rgba(99,102,241,0.1)', borderRadius:8, fontSize:12, color:'#818cf8' }}>
            📝 {sub.adminNote}
          </div>
        )}
      </div>

      {/* Plan limits */}
      <div className="grid grid-2" style={{ marginBottom:24 }}>
        <div className="card">
          <h3 style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>📊 {isAr ? 'حدود الاستخدام' : 'Usage Limits'}</h3>
          <Limit label={isAr ? 'عدد البوتات' : 'Bots'} value={planDetails.limits?.bots} />
          <Limit label={isAr ? 'الصفحات المرتبطة' : 'Connected Pages'} value={planDetails.limits?.pages} />
          <Limit label={isAr ? 'رسائل شهرياً' : 'Messages/Month'} value={planDetails.limits?.messagesPerMonth} />
          <Limit label={isAr ? 'أعضاء الفريق' : 'Team Members'} value={planDetails.limits?.teamMembers} />
          <Limit label={isAr ? 'منشورات مجدولة' : 'Scheduled Posts'} value={planDetails.limits?.scheduledPosts} />
          <Limit label={isAr ? 'اختبارات A/B' : 'A/B Tests'} value={planDetails.limits?.abTests} />
        </div>
        <div className="card">
          <h3 style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>✨ {isAr ? 'المميزات' : 'Features'}</h3>
          <Limit label={isAr ? 'ردود الذكاء الاصطناعي' : 'AI Replies'} value={planDetails.limits?.aiReplies} />
          <Limit label={isAr ? 'الترجمة التلقائية' : 'Auto Translate'} value={planDetails.limits?.autoTranslate} />
          <Limit label={isAr ? 'إشعارات Push' : 'Push Notifications'} value={planDetails.limits?.pushNotifications} />
          <Limit label={isAr ? 'تتبع التحويلات' : 'Conversion Tracking'} value={planDetails.limits?.conversionTracking} />
          <Limit label={isAr ? 'إحصائيات متقدمة' : 'Advanced Analytics'} value={planDetails.limits?.advancedAnalytics} />
        </div>
      </div>

      {/* All plans comparison */}
      <div className="card">
        <h3 style={{ fontSize:16, fontWeight:700, marginBottom:20 }}>🔄 {isAr ? 'مقارنة الخطط' : 'Plans Comparison'}</h3>
        <div className="grid grid-3" style={{ gap:16 }}>
          {Object.entries(plans).map(([key, plan]) => (
            <div key={key} style={{
              padding:20, borderRadius:14, textAlign:'center',
              border:`2px solid ${key === current ? PLAN_COLORS[key] : '#334155'}`,
              background: key === current ? `${PLAN_COLORS[key]}11` : 'transparent',
              position:'relative'
            }}>
              {key === current && (
                <div style={{ position:'absolute', top:-10, left:'50%', transform:'translateX(-50%)', background:PLAN_COLORS[key], color:'white', borderRadius:100, padding:'2px 12px', fontSize:11, fontWeight:700 }}>
                  {isAr ? 'الحالية' : 'CURRENT'}
                </div>
              )}
              <div style={{ fontSize:32, marginBottom:8 }}>{PLAN_ICONS[key]}</div>
              <div style={{ fontWeight:800, fontSize:18, color:PLAN_COLORS[key], marginBottom:4 }}>
                {isAr ? plan.nameAr : plan.name}
              </div>
              <div style={{ fontSize:28, fontWeight:900, marginBottom:16 }}>
                ${plan.price}<span style={{ fontSize:13, color:'#64748b', fontWeight:400 }}>/mo</span>
              </div>
              <div style={{ fontSize:12, color:'#94a3b8', textAlign:'start', lineHeight:2 }}>
                <div>🤖 {plan.limits.bots === -1 ? '∞' : plan.limits.bots} {isAr ? 'بوت' : 'bots'}</div>
                <div>🔗 {plan.limits.pages === -1 ? '∞' : plan.limits.pages} {isAr ? 'صفحة' : 'pages'}</div>
                <div>💬 {plan.limits.messagesPerMonth === -1 ? '∞' : plan.limits.messagesPerMonth?.toLocaleString()} {isAr ? 'رسالة' : 'msgs'}</div>
                <div>👥 {plan.limits.teamMembers === -1 ? '∞' : plan.limits.teamMembers} {isAr ? 'عضو' : 'members'}</div>
                {plan.limits.aiReplies && <div>🧠 AI</div>}
                {plan.limits.autoTranslate && <div>🌍 {isAr ? 'ترجمة تلقائية' : 'Auto Translate'}</div>}
              </div>
            </div>
          ))}
        </div>
        <p style={{ marginTop:16, fontSize:13, color:'#64748b', textAlign:'center' }}>
          {isAr ? 'للترقية، تواصل مع الدعم الفني أو انتظر رسالة ترقية من الأدمن.' : 'To upgrade, contact support or wait for an admin upgrade notification.'}
        </p>
      </div>
    </div>
  );
}
