import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || '/api';

export default function PrivacyPolicy() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [policy, setPolicy] = useState(null);

  useEffect(() => {
    axios.get(`${API}/privacy`).then(r => setPolicy(r.data)).catch(() => {});
  }, []);

  const content = policy ? (isAr && policy.contentAr ? policy.contentAr : policy.content) : '...';

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', padding: '40px 20px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>💬</div>
            <span style={{ fontWeight: 800, fontSize: 18, background: 'linear-gradient(135deg,#818cf8,#c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ChatCTA</span>
          </Link>
          <button onClick={() => {
            const n = isAr ? 'en' : 'ar';
            i18n.changeLanguage(n);
            document.documentElement.dir = n === 'ar' ? 'rtl' : 'ltr';
          }} className="btn btn-outline btn-sm">{isAr ? 'EN' : 'عربي'}</button>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid #334155' }}>
            <h1 style={{ fontSize: 24, fontWeight: 800 }}>🔒 {isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}</h1>
            {policy && <span style={{ fontSize: 12, color: '#64748b' }}>{isAr ? 'آخر تحديث:' : 'Last updated:'} {new Date(policy.updatedAt || policy.createdAt).toLocaleDateString(isAr ? 'ar' : 'en')} • v{policy.version}</span>}
          </div>
          <div style={{ lineHeight: 2, fontSize: 15, color: '#cbd5e1' }}>
            {content.split('\n').map((line, i) => {
              if (line.startsWith('## ')) return <h3 key={i} style={{ fontSize: 16, fontWeight: 700, marginTop: 24, marginBottom: 8, color: '#f1f5f9' }}>{line.replace('## ', '')}</h3>;
              if (line.startsWith('# ')) return <h2 key={i} style={{ fontSize: 20, fontWeight: 800, marginBottom: 16, color: '#818cf8' }}>{line.replace('# ', '')}</h2>;
              if (line === '') return <div key={i} style={{ height: 8 }} />;
              return <p key={i} style={{ marginBottom: 4 }}>{line}</p>;
            })}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24, color: '#475569', fontSize: 13 }}>
          <Link to="/" style={{ color: '#6366f1', textDecoration: 'none' }}>← {isAr ? 'العودة للرئيسية' : 'Back to Home'}</Link>
        </div>
      </div>
    </div>
  );
}
