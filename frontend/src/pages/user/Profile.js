import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../store/authStore';

const API = process.env.REACT_APP_API_URL || '/api';

export default function Profile() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', language: user?.language || 'ar' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [avatar, setAvatar] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      if (avatar) formData.append('avatar', avatar);
      const res = await axios.put(`${API}/users/profile`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      updateUser(res.data);
      toast.success(isAr ? 'تم تحديث الملف الشخصي' : 'Profile updated');
      if (form.language !== i18n.language) {
        i18n.changeLanguage(form.language);
        document.documentElement.dir = form.language === 'ar' ? 'rtl' : 'ltr';
      }
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
    finally { setSavingProfile(false); }
  };

  const handlePwSave = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) return toast.error(isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
    setSavingPw(true);
    try {
      await axios.put(`${API}/auth/change-password`, { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success(isAr ? 'تم تغيير كلمة المرور' : 'Password changed');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
    finally { setSavingPw(false); }
  };

  const F = ({ label, children }) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#94a3b8' }}>{label}</label>
      {children}
    </div>
  );

  return (
    <div style={{ maxWidth: 700 }}>
      <div className="page-header">
        <h1>{isAr ? 'الملف الشخصي' : 'Profile'}</h1>
        <p style={{ color: '#64748b' }}>{isAr ? 'تعديل بياناتك الشخصية' : 'Edit your personal information'}</p>
      </div>

      {/* Avatar */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 80, height: 80, borderRadius: 20, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 700, overflow: 'hidden' }}>
            {user?.avatar ? <img src={`${process.env.REACT_APP_API_URL?.replace('/api', '') || ''}${user.avatar}`} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 18 }}>{user?.name}</p>
            <p style={{ color: '#64748b', fontSize: 13 }}>{user?.email}</p>
            <label className="btn btn-outline btn-sm" style={{ marginTop: 8, cursor: 'pointer' }}>
              {isAr ? 'تغيير الصورة' : 'Change Avatar'}
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setAvatar(e.target.files[0])} />
            </label>
            {avatar && <span style={{ fontSize: 12, color: '#10b981', marginRight: 8 }}>✓ {avatar.name}</span>}
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 20, fontSize: 16, fontWeight: 600 }}>👤 {isAr ? 'المعلومات الشخصية' : 'Personal Information'}</h3>
        <form onSubmit={handleProfileSave}>
          <div className="grid grid-2">
            <F label={isAr ? 'الاسم الكامل' : 'Full Name'}>
              <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </F>
            <F label={isAr ? 'رقم الهاتف' : 'Phone'}>
              <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </F>
          </div>
          <F label={isAr ? 'اللغة المفضلة' : 'Preferred Language'}>
            <select className="input" value={form.language} onChange={e => setForm({ ...form, language: e.target.value })}>
              <option value="ar">{isAr ? 'العربية' : 'Arabic'}</option>
              <option value="en">{isAr ? 'الإنجليزية' : 'English'}</option>
            </select>
          </F>
          <div style={{ marginTop: 4 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#94a3b8' }}>{isAr ? 'البريد الإلكتروني' : 'Email'}</label>
            <input className="input" value={user?.email || ''} disabled style={{ opacity: 0.5 }} />
          </div>
          <div style={{ marginTop: 16 }}>
            <button type="submit" className="btn btn-primary" disabled={savingProfile}>{savingProfile ? '...' : (isAr ? 'حفظ التغييرات' : 'Save Changes')}</button>
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 20, fontSize: 16, fontWeight: 600 }}>🔑 {isAr ? 'تغيير كلمة المرور' : 'Change Password'}</h3>
        <form onSubmit={handlePwSave}>
          <F label={isAr ? 'كلمة المرور الحالية' : 'Current Password'}>
            <input className="input" type="password" value={pwForm.currentPassword} onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })} required />
          </F>
          <div className="grid grid-2">
            <F label={isAr ? 'كلمة المرور الجديدة' : 'New Password'}>
              <input className="input" type="password" value={pwForm.newPassword} onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} required />
            </F>
            <F label={isAr ? 'تأكيد كلمة المرور' : 'Confirm Password'}>
              <input className="input" type="password" value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} required />
            </F>
          </div>
          <button type="submit" className="btn btn-primary" disabled={savingPw}>{savingPw ? '...' : (isAr ? 'تغيير كلمة المرور' : 'Change Password')}</button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="card" style={{ border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.03)' }}>
        <h3 style={{ marginBottom: 12, fontSize: 16, fontWeight: 600, color: '#ef4444' }}>⚠️ {isAr ? 'منطقة الخطر' : 'Danger Zone'}</h3>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>{isAr ? 'حذف حسابك سيؤدي إلى حذف جميع بياناتك بشكل دائم' : 'Deleting your account will permanently remove all your data'}</p>
        <button onClick={() => navigate('/dashboard/delete-account')} className="btn btn-danger btn-sm">{isAr ? '🗑️ حذف الحساب' : '🗑️ Delete Account'}</button>
      </div>
    </div>
  );
}
