import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = process.env.REACT_APP_API_URL || '/api';

export default function AdminUsers() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [banReason, setBanReason] = useState('');
  const [msgContent, setMsgContent] = useState('');
  const [msgModal, setMsgModal] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 15, ...(search && { search }), ...(status && { status }) });
    const res = await axios.get(`${API}/admin/users?${params}`);
    setUsers(res.data.users); setTotal(res.data.total);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [page, search, status]);

  const handleBan = async (id, reason) => {
    await axios.put(`${API}/admin/users/${id}/ban`, { reason });
    toast.success(isAr ? 'تم حظر المستخدم' : 'User banned');
    fetchUsers(); setSelected(null); setBanReason('');
  };

  const handleUnban = async (id) => {
    await axios.put(`${API}/admin/users/${id}/unban`);
    toast.success(isAr ? 'تم رفع الحظر' : 'User unbanned');
    fetchUsers();
  };

  const handleDelete = async (id) => {
    if (!window.confirm(isAr ? 'هل أنت متأكد؟' : 'Are you sure?')) return;
    await axios.delete(`${API}/admin/users/${id}`);
    toast.success(isAr ? 'تم حذف المستخدم' : 'User deleted');
    fetchUsers();
  };

  const handleSendMsg = async (userId) => {
    try {
      await axios.post(`${API}/admin/message-user`, { userId, content: msgContent });
      toast.success(isAr ? 'تم إرسال الرسالة' : 'Message sent');
      setMsgModal(null); setMsgContent('');
    } catch { toast.error(isAr ? 'فشل الإرسال' : 'Failed'); }
  };

  return (
    <div>
      <div className="page-header">
        <h1>{isAr ? 'إدارة المستخدمين' : 'User Management'}</h1>
        <p style={{ color: '#64748b' }}>{total} {isAr ? 'مستخدم' : 'users'}</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input className="input" placeholder={isAr ? 'بحث باسم أو إيميل...' : 'Search by name or email...'} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ flex: 1, minWidth: 200 }} />
        <select className="input" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} style={{ width: 160 }}>
          <option value="">{isAr ? 'الكل' : 'All'}</option>
          <option value="active">{isAr ? 'نشط' : 'Active'}</option>
          <option value="banned">{isAr ? 'محظور' : 'Banned'}</option>
        </select>
      </div>

      <div className="card p-0">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>{isAr ? 'المستخدم' : 'User'}</th>
                <th>{isAr ? 'الهاتف' : 'Phone'}</th>
                <th>{isAr ? 'التسجيل' : 'Registered'}</th>
                <th>{isAr ? 'آخر دخول' : 'Last Login'}</th>
                <th>{isAr ? 'الحالة' : 'Status'}</th>
                <th>{isAr ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</span>
                      <span style={{ fontSize: 12, color: '#64748b' }}>{u.email}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 13, color: '#94a3b8' }}>{u.phone || '-'}</td>
                  <td style={{ fontSize: 12, color: '#64748b' }}>{new Date(u.createdAt).toLocaleDateString(isAr ? 'ar' : 'en')}</td>
                  <td style={{ fontSize: 12, color: '#64748b' }}>{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString(isAr ? 'ar' : 'en') : '-'}</td>
                  <td>
                    {u.isBanned
                      ? <span className="badge badge-danger">{isAr ? 'محظور' : 'Banned'}</span>
                      : <span className="badge badge-success">{isAr ? 'نشط' : 'Active'}</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button onClick={() => setMsgModal(u._id)} className="btn btn-sm btn-outline" title={isAr ? 'مراسلة' : 'Message'}>✉️</button>
                      {u.isBanned
                        ? <button onClick={() => handleUnban(u._id)} className="btn btn-sm btn-success">{isAr ? 'رفع الحظر' : 'Unban'}</button>
                        : <button onClick={() => setSelected(u._id)} className="btn btn-sm btn-outline" style={{ color: '#f59e0b', borderColor: '#f59e0b40' }}>{isAr ? 'حظر' : 'Ban'}</button>}
                      <button onClick={() => handleDelete(u._id)} className="btn btn-sm btn-danger">{isAr ? 'حذف' : 'Del'}</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && users.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>{isAr ? 'لا توجد نتائج' : 'No results'}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {total > 15 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
          {page > 1 && <button onClick={() => setPage(p => p - 1)} className="btn btn-outline btn-sm">←</button>}
          <span style={{ fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center' }}>{page} / {Math.ceil(total / 15)}</span>
          {page < Math.ceil(total / 15) && <button onClick={() => setPage(p => p + 1)} className="btn btn-outline btn-sm">→</button>}
        </div>
      )}

      {/* Ban Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <h3 className="modal-title">{isAr ? 'حظر المستخدم' : 'Ban User'}</h3>
            <input className="input" placeholder={isAr ? 'سبب الحظر (اختياري)' : 'Ban reason (optional)'} value={banReason} onChange={e => setBanReason(e.target.value)} style={{ marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setSelected(null)} className="btn btn-outline">{isAr ? 'إلغاء' : 'Cancel'}</button>
              <button onClick={() => handleBan(selected, banReason)} className="btn btn-danger">{isAr ? 'تأكيد الحظر' : 'Confirm Ban'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {msgModal && (
        <div className="modal-overlay" onClick={() => setMsgModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <h3 className="modal-title">{isAr ? 'مراسلة المستخدم' : 'Message User'}</h3>
            <textarea className="input" rows={4} value={msgContent} onChange={e => setMsgContent(e.target.value)} placeholder={isAr ? 'اكتب رسالتك...' : 'Write your message...'} style={{ marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setMsgModal(null)} className="btn btn-outline">{isAr ? 'إلغاء' : 'Cancel'}</button>
              <button onClick={() => handleSendMsg(msgModal)} className="btn btn-primary">{isAr ? 'إرسال' : 'Send'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
