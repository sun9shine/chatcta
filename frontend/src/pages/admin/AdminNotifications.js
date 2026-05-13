import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = process.env.REACT_APP_API_URL || '/api';

export default function AdminNotifications() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ title:'', body:'', url:'/', allUsers:true, userIds:[] });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [vapidKey, setVapidKey] = useState('');

  useEffect(() => {
    axios.get(`${API}/admin/users?limit=100`).then(r => setUsers(r.data.users));
    axios.get(`${API}/notifications/vapid-key`).then(r => setVapidKey(r.data.publicKey)).catch(()=>{});
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    setSending(true); setResult(null);
    try {
      const res = await axios.post(`${API}/notifications/send`, form);
      setResult(res.data);
      toast.success(isAr ? `تم الإرسال لـ ${res.data.sent} جهاز` : `Sent to ${res.data.sent} devices`);
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
    finally { setSending(false); }
  };

  return (
    <div style={{ maxWidth:760 }}>
      <div className="page-header">
        <h1>🔔 {isAr?'إشعارات Push':'Push Notifications'}</h1>
        <p style={{ color:'#64748b' }}>{isAr?'إرسال إشعارات فورية للمستخدمين':'Send instant push notifications to users'}</p>
      </div>

      {!vapidKey && (
        <div style={{ background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:12, padding:'12px 16px', marginBottom:20, fontSize:13, color:'#f59e0b' }}>
          ⚠️ {isAr
            ? 'VAPID keys غير مضبوطة. أضف VAPID_PUBLIC_KEY و VAPID_PRIVATE_KEY في ملف .env لتفعيل Push Notifications. ستصل الإشعارات عبر Socket.io للمستخدمين المتصلين فقط.'
            : 'VAPID keys not configured. Add VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY to .env to enable push. Notifications will reach connected users via Socket.io only.'}
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSend}>
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', marginBottom:6, fontSize:13, color:'#94a3b8' }}>{isAr?'عنوان الإشعار':'Notification Title'}</label>
            <input className="input" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder={isAr?'عنوان مختصر':'Short title'} required />
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', marginBottom:6, fontSize:13, color:'#94a3b8' }}>{isAr?'نص الإشعار':'Notification Body'}</label>
            <textarea className="input" rows={3} value={form.body} onChange={e=>setForm({...form,body:e.target.value})} required />
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', marginBottom:6, fontSize:13, color:'#94a3b8' }}>{isAr?'رابط عند الضغط (اختياري)':'Click URL (optional)'}</label>
            <input className="input" value={form.url} onChange={e=>setForm({...form,url:e.target.value})} placeholder="/" />
          </div>

          <div style={{ marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
              <label className="switch">
                <input type="checkbox" checked={form.allUsers} onChange={e=>setForm({...form,allUsers:e.target.checked})} />
                <span className="slider"></span>
              </label>
              <span style={{ fontSize:13, fontWeight:500 }}>{isAr?'إرسال لجميع المستخدمين':'Send to all users'}</span>
            </div>
            {!form.allUsers && (
              <div>
                <label style={{ display:'block', marginBottom:8, fontSize:13, color:'#94a3b8' }}>{isAr?'اختر المستخدمين':'Select users'}</label>
                <div style={{ maxHeight:180, overflow:'auto', background:'#0f172a', borderRadius:10, padding:12, display:'flex', flexDirection:'column', gap:5 }}>
                  {users.map(u => (
                    <label key={u._id} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13 }}>
                      <input type="checkbox" checked={form.userIds.includes(u._id)}
                        onChange={e => setForm(prev => ({ ...prev, userIds: e.target.checked
                          ? [...prev.userIds, u._id]
                          : prev.userIds.filter(id=>id!==u._id) }))} />
                      {u.name} <span style={{ color:'#64748b' }}>({u.email})</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {result && (
            <div style={{ padding:'12px 16px', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:10, marginBottom:16, fontSize:13, color:'#10b981' }}>
              ✅ {isAr?`تم الإرسال: ${result.sent}/${result.total} جهاز`:`Sent: ${result.sent}/${result.total} devices`}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={sending}>
            {sending ? (isAr?'جاري الإرسال...':'Sending...') : `🔔 ${isAr?'إرسال الإشعار':'Send Notification'}`}
          </button>
        </form>
      </div>

      {/* VAPID setup guide */}
      <div className="card" style={{ marginTop:20, background:'rgba(99,102,241,0.05)', border:'1px solid rgba(99,102,241,0.2)' }}>
        <h3 style={{ marginBottom:12, fontSize:15, fontWeight:600 }}>⚙️ {isAr?'إعداد VAPID Keys':'Setup VAPID Keys'}</h3>
        <div style={{ fontSize:13, color:'#94a3b8', lineHeight:2 }}>
          <p>1. {isAr?'ثبت مكتبة web-push:':'Install web-push:'} <code style={{ color:'#818cf8' }}>npm install web-push</code></p>
          <p>2. {isAr?'أنشئ مفاتيح VAPID:':'Generate VAPID keys:'} <code style={{ color:'#818cf8' }}>node -e "const wp=require('web-push'); const k=wp.generateVAPIDKeys(); console.log(k)"</code></p>
          <p>3. {isAr?'أضف في .env:':'Add to .env:'}</p>
          <div style={{ background:'#0f172a', borderRadius:8, padding:'10px 14px', fontFamily:'monospace', fontSize:12, color:'#818cf8' }}>
            VAPID_PUBLIC_KEY=your_public_key<br/>
            VAPID_PRIVATE_KEY=your_private_key
          </div>
        </div>
      </div>
    </div>
  );
}
