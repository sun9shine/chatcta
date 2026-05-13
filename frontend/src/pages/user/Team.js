import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = process.env.REACT_APP_API_URL || '/api';
const ROLE_COLORS = { viewer:'#64748b', editor:'#6366f1', manager:'#f59e0b' };
const STATUS_COLORS = { pending:'#f59e0b', active:'#10b981', rejected:'#ef4444' };

export default function Team() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [members, setMembers] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email:'', role:'editor' });
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/team`).then(r => setMembers(r.data)),
      axios.get(`${API}/team/mine`).then(r => setMemberships(r.data)),
      axios.get(`${API}/subscriptions/my`).then(r => setSub(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    try {
      const res = await axios.post(`${API}/team/invite`, inviteForm);
      setMembers(prev => [...prev, res.data.member]);
      setInviteLink(res.data.inviteUrl);
      toast.success(isAr?'تم إرسال الدعوة':'Invitation sent');
    } catch (err) { toast.error(err.response?.data?.error || (isAr?'حد الخطة':'Plan limit reached')); }
    finally { setInviting(false); }
  };

  const handleRemove = async (id) => {
    if (!window.confirm(isAr?'إزالة هذا العضو؟':'Remove this member?')) return;
    await axios.delete(`${API}/team/${id}`);
    setMembers(prev => prev.filter(m=>m._id!==id));
    toast.success(isAr?'تم الإزالة':'Removed');
  };

  const limit = sub ? (sub.planDetails?.limits?.teamMembers ?? 1) : 1;

  if (loading) return <div style={{ padding:60, textAlign:'center', color:'#64748b' }}>...</div>;

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1>👥 {isAr?'إدارة الفريق':'Team Management'}</h1>
          <p style={{ color:'#64748b' }}>
            {members.length} / {limit === -1 ? '∞' : limit} {isAr?'عضو':'members'}
          </p>
        </div>
        <button onClick={() => { setShowInvite(true); setInviteLink(''); }} className="btn btn-primary"
          disabled={limit !== -1 && members.filter(m=>m.status==='active').length >= limit}>
          + {isAr?'دعوة عضو':'Invite Member'}
        </button>
      </div>

      {limit !== -1 && members.filter(m=>m.status==='active').length >= limit && (
        <div style={{ background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:12, padding:'12px 16px', marginBottom:20, fontSize:13, color:'#f59e0b' }}>
          ⚠️ {isAr?`وصلت لحد خطتك (${limit} أعضاء). قم بترقية خطتك لإضافة أعضاء أكثر.`:`You've reached your plan limit (${limit} members). Upgrade to add more.`}
        </div>
      )}

      {/* My Team (as owner) */}
      <div className="card" style={{ marginBottom:20 }}>
        <h3 style={{ marginBottom:16, fontSize:15, fontWeight:600 }}>👑 {isAr?'فريقي':'My Team'}</h3>
        {members.length === 0 ? (
          <p style={{ color:'#64748b', fontSize:13, textAlign:'center', padding:'20px 0' }}>
            {isAr?'لم تدعُ أي عضو بعد':'No team members yet'}
          </p>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {members.map(m => (
              <div key={m._id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', background:'#0f172a', borderRadius:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>
                    {m.memberId?.name?.[0]?.toUpperCase() || m.email[0].toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontWeight:600, fontSize:14 }}>{m.memberId?.name || m.email}</p>
                    <p style={{ fontSize:12, color:'#64748b' }}>{m.email}</p>
                  </div>
                </div>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <span className="badge" style={{ background:`${ROLE_COLORS[m.role]}22`, color:ROLE_COLORS[m.role] }}>{m.role}</span>
                  <span className="badge" style={{ background:`${STATUS_COLORS[m.status]}22`, color:STATUS_COLORS[m.status] }}>{m.status}</span>
                  <button onClick={() => handleRemove(m._id)} className="btn btn-sm btn-danger">✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Teams I belong to */}
      {memberships.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom:16, fontSize:15, fontWeight:600 }}>🤝 {isAr?'الفرق التي أنتمي إليها':'Teams I Belong To'}</h3>
          {memberships.map(m => (
            <div key={m._id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', background:'#0f172a', borderRadius:10, marginBottom:8 }}>
              <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#f59e0b,#d97706)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>
                  {m.ownerId?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p style={{ fontWeight:600, fontSize:14 }}>{m.ownerId?.name}</p>
                  <p style={{ fontSize:12, color:'#64748b' }}>{m.ownerId?.email} • {isAr?'خطة:':'plan:'} {m.ownerId?.plan}</p>
                </div>
              </div>
              <span className="badge" style={{ background:`${ROLE_COLORS[m.role]}22`, color:ROLE_COLORS[m.role] }}>{m.role}</span>
            </div>
          ))}
        </div>
      )}

      {/* Invite Modal */}
      {showInvite && (
        <div className="modal-overlay" onClick={() => setShowInvite(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{ maxWidth:420 }}>
            <h3 className="modal-title">👥 {isAr?'دعوة عضو جديد':'Invite New Member'}</h3>
            {inviteLink ? (
              <div>
                <p style={{ fontSize:13, color:'#10b981', marginBottom:12 }}>✅ {isAr?'تم إرسال الدعوة!':'Invitation sent!'}</p>
                <div style={{ background:'#0f172a', borderRadius:10, padding:'10px 14px', fontSize:12, wordBreak:'break-all', color:'#818cf8' }}>
                  {inviteLink}
                </div>
                <button onClick={() => { navigator.clipboard.writeText(inviteLink); toast.success(isAr?'تم النسخ':'Copied'); }} className="btn btn-outline btn-sm" style={{ marginTop:10 }}>
                  {isAr?'نسخ الرابط':'Copy Link'}
                </button>
                <div style={{ marginTop:16 }}>
                  <button onClick={() => setShowInvite(false)} className="btn btn-primary" style={{ width:'100%', justifyContent:'center' }}>{isAr?'إغلاق':'Close'}</button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInvite}>
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:'block', marginBottom:6, fontSize:13, color:'#94a3b8' }}>{isAr?'البريد الإلكتروني':'Email'}</label>
                  <input className="input" type="email" value={inviteForm.email} onChange={e=>setInviteForm({...inviteForm,email:e.target.value})} required />
                </div>
                <div style={{ marginBottom:20 }}>
                  <label style={{ display:'block', marginBottom:6, fontSize:13, color:'#94a3b8' }}>{isAr?'الدور':'Role'}</label>
                  <select className="input" value={inviteForm.role} onChange={e=>setInviteForm({...inviteForm,role:e.target.value})}>
                    <option value="viewer">{isAr?'مشاهد':'Viewer'}</option>
                    <option value="editor">{isAr?'محرر':'Editor'}</option>
                    <option value="manager">{isAr?'مدير':'Manager'}</option>
                  </select>
                </div>
                <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                  <button type="button" onClick={() => setShowInvite(false)} className="btn btn-outline">{isAr?'إلغاء':'Cancel'}</button>
                  <button type="submit" className="btn btn-primary" disabled={inviting}>{inviting?'...':(isAr?'إرسال الدعوة':'Send Invite')}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
