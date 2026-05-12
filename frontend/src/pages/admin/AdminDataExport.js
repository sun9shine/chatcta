import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || '/api';

export default function AdminDataExport() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    axios.get(`${API}/admin/data-export`).then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  const filtered = data.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.includes(search)
  );

  const exportCSV = () => {
    const rows = [
      ['Name', 'Email', 'Phone', 'Registered', 'Last Login', 'Banned', 'Pages'],
      ...filtered.map(u => [u.name, u.email, u.phone || '', new Date(u.registeredAt).toLocaleDateString(), u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : '', u.isBanned ? 'Yes' : 'No', u.pages?.map(p => `${p.platform}:${p.pageName}`).join('; ')])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'chatcta-users.csv'; a.click();
  };

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>...</div>;

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1>📁 {isAr ? 'تصدير بيانات المستخدمين' : 'Export User Data'}</h1>
          <p style={{ color: '#64748b' }}>{data.length} {isAr ? 'مستخدم' : 'users'}</p>
        </div>
        <button onClick={exportCSV} className="btn btn-primary">⬇️ {isAr ? 'تصدير CSV' : 'Export CSV'}</button>
      </div>

      <input className="input" placeholder={isAr ? 'بحث...' : 'Search...'} value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: 20, maxWidth: 400 }} />

      <div className="card p-0">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>{isAr ? 'الاسم' : 'Name'}</th>
                <th>{isAr ? 'البريد' : 'Email'}</th>
                <th>{isAr ? 'الهاتف' : 'Phone'}</th>
                <th>{isAr ? 'التسجيل' : 'Registered'}</th>
                <th>{isAr ? 'الصفحات' : 'Pages'}</th>
                <th>{isAr ? 'الحالة' : 'Status'}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</td>
                  <td style={{ fontSize: 13, color: '#94a3b8' }}>{u.email}</td>
                  <td style={{ fontSize: 13, color: '#94a3b8' }}>{u.phone || '-'}</td>
                  <td style={{ fontSize: 12, color: '#64748b' }}>{new Date(u.registeredAt).toLocaleDateString(isAr ? 'ar' : 'en')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {(u.pages || []).map((p, i) => (
                        <span key={i} className="badge badge-primary" style={{ fontSize: 10 }}>{p.platform}</span>
                      ))}
                      {(!u.pages || u.pages.length === 0) && <span style={{ color: '#475569', fontSize: 12 }}>-</span>}
                    </div>
                  </td>
                  <td>
                    {u.isBanned
                      ? <span className="badge badge-danger">{isAr ? 'محظور' : 'Banned'}</span>
                      : <span className="badge badge-success">{isAr ? 'نشط' : 'Active'}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
