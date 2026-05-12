import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = process.env.REACT_APP_API_URL || '/api';

const DEFAULT_PRIVACY_AR = `# سياسة الخصوصية

## 1. المعلومات التي نجمعها
نقوم بجمع المعلومات التي تقدمها عند إنشاء حساب، بما في ذلك الاسم والبريد الإلكتروني ورقم الهاتف.

## 2. كيفية استخدام المعلومات
نستخدم معلوماتك لتقديم خدماتنا وتحسينها، وإرسال الإشعارات المهمة.

## 3. مشاركة المعلومات
لا نبيع أو نشارك معلوماتك الشخصية مع أطراف ثالثة إلا بموافقتك.

## 4. التكامل مع وسائل التواصل الاجتماعي
عند ربط حساباتك على وسائل التواصل الاجتماعي (فيسبوك، إنستغرام، واتساب، تيليجرام، تيك توك)، نلتزم بسياسات الخصوصية الخاصة بكل منصة.

## 5. الأمان
نستخدم تشفير SSL وأفضل الممارسات الأمنية لحماية بياناتك.

## 6. حقوقك
يحق لك طلب حذف حسابك وجميع بياناتك في أي وقت.

## 7. التواصل
للاستفسارات، تواصل معنا عبر صفحة الدعم الفني.`;

const DEFAULT_PRIVACY_EN = `# Privacy Policy

## 1. Information We Collect
We collect information you provide when creating an account, including name, email, and phone number.

## 2. How We Use Information
We use your information to provide and improve our services and send important notifications.

## 3. Information Sharing
We do not sell or share your personal information with third parties without your consent.

## 4. Social Media Integration
When connecting your social media accounts (Facebook, Instagram, WhatsApp, Telegram, TikTok), we comply with each platform's privacy policies.

## 5. Security
We use SSL encryption and best security practices to protect your data.

## 6. Your Rights
You can request deletion of your account and all data at any time.

## 7. Contact
For inquiries, contact us via the support page.`;

export default function AdminPrivacy() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [form, setForm] = useState({ content: DEFAULT_PRIVACY_EN, contentAr: DEFAULT_PRIVACY_AR, version: '1.0' });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('ar');

  useEffect(() => {
    axios.get(`${API}/privacy`).then(r => { if (r.data.content) setForm(prev => ({ ...prev, ...r.data })); }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/privacy`, form);
      toast.success(isAr ? 'تم حفظ سياسة الخصوصية' : 'Privacy policy saved');
    } catch { toast.error('Error'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1>🔒 {isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}</h1>
          <p style={{ color: '#64748b' }}>{isAr ? 'تعديل سياسة الخصوصية - تنطبق على جميع المنصات' : 'Edit privacy policy - applies to all platforms'}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Version</label>
            <input className="input" value={form.version} onChange={e => setForm({ ...form, version: e.target.value })} style={{ width: 80 }} />
          </div>
          <button onClick={handleSave} className="btn btn-primary" disabled={saving} style={{ marginTop: 18 }}>{saving ? '...' : (isAr ? 'حفظ' : 'Save')}</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        <button onClick={() => setTab('ar')} className={`btn btn-sm ${tab === 'ar' ? 'btn-primary' : 'btn-outline'}`}>🇸🇦 العربية</button>
        <button onClick={() => setTab('en')} className={`btn btn-sm ${tab === 'en' ? 'btn-primary' : 'btn-outline'}`}>🇺🇸 English</button>
      </div>

      <div className="card">
        {tab === 'ar' ? (
          <textarea
            className="input" rows={25}
            value={form.contentAr} onChange={e => setForm({ ...form, contentAr: e.target.value })}
            style={{ fontFamily: 'Cairo, sans-serif', fontSize: 14, lineHeight: 1.8 }}
            placeholder="سياسة الخصوصية باللغة العربية..."
          />
        ) : (
          <textarea
            className="input" rows={25}
            value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
            style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, lineHeight: 1.8 }}
            placeholder="Privacy policy in English..."
          />
        )}
      </div>
    </div>
  );
}
