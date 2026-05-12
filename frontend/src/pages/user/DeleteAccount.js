import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../store/authStore';

const API = process.env.REACT_APP_API_URL || '/api';

export default function DeleteAccount() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDelete = async (e) => {
    e.preventDefault();
    if (confirm !== 'DELETE') return toast.error(isAr ? 'اكتب DELETE للتأكيد' : 'Type DELETE to confirm');
    setLoading(true);
    try {
      await axios.delete(`${API}/users/account`, { data: { password } });
      logout();
      toast.success(isAr ? 'تم حذف الحساب' : 'Account deleted');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || (isAr ? 'كلمة المرور غير صحيحة' : 'Incorrect password'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 500 }}>
      <div className="page-header">
        <h1 style={{ color: '#ef4444' }}>⚠️ {isAr ? 'حذف الحساب' : 'Delete Account'}</h1>
      </div>
      <div className="card" style={{ border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.03)' }}>
        <p style={{ color: '#f59e0b', marginBottom: 20, fontSize: 14, background: 'rgba(245,158,11,0.1)', padding: '12px 16px', borderRadius: 10, border: '1px solid rgba(245,158,11,0.2)' }}>
          ⚠️ {isAr ? 'هذا الإجراء لا يمكن التراجع عنه! سيتم حذف جميع بياناتك وصفحاتك وبوتاتك بشكل دائم.' : 'This action cannot be undone! All your data, pages, and bots will be permanently deleted.'}
        </p>
        <form onSubmit={handleDelete}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#94a3b8' }}>{isAr ? 'كلمة المرور' : 'Password'}</label>
            <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#94a3b8' }}>
              {isAr ? 'اكتب "DELETE" للتأكيد' : 'Type "DELETE" to confirm'}
            </label>
            <input className="input" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="DELETE" required />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={() => navigate('/dashboard/profile')} className="btn btn-outline">{isAr ? 'إلغاء' : 'Cancel'}</button>
            <button type="submit" className="btn btn-danger" disabled={loading || confirm !== 'DELETE'}>
              {loading ? '...' : (isAr ? '🗑️ تأكيد الحذف' : '🗑️ Confirm Delete')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
