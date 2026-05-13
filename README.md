# ChatCTA - منصة أتمتة وسائل التواصل الاجتماعي
# ChatCTA - Social Media Automation Platform

<div align="center">

**منصة متكاملة للرد التلقائي والمراسلة الذكية عبر جميع منصات التواصل الاجتماعي**

**Complete platform for auto-reply and smart messaging across all social media platforms**

</div>

---

## 📋 المحتويات / Contents

- [التشغيل السريع](#-التشغيل-السريع)
- [ربط Facebook](#-ربط-facebook)
- [ربط Instagram](#-ربط-instagram)
- [ربط WhatsApp Business](#-ربط-whatsapp-business)
- [ربط Telegram](#-ربط-telegram)
- [ربط TikTok](#-ربط-tiktok)
- [إعداد الويبهوك على VPS](#-إعداد-الويبهوك-على-vps)

---

## 🚀 التشغيل السريع

### المتطلبات
- Docker + Docker Compose

### التشغيل المحلي
```bash
git clone https://github.com/sun9shine/chatcta
cd chatcta
cp .env.example .env
chmod +x start.sh
./start.sh
```

### التشغيل على VPS
```bash
git clone https://github.com/sun9shine/chatcta
cd chatcta
cp .env.example .env
nano .env    # عدّل: ADMIN_PASSWORD, JWT_SECRET, FRONTEND_URL
./start.sh
```

### بيانات الدخول
```
Admin:    admin@chatcta.com / Admin@12345
Web:      http://localhost  (محلي)  |  http://your-domain.com  (VPS)
Admin:    http://localhost/admin
```

---

## 📘 ربط Facebook

### المتطلبات
- صفحة فيسبوك (Facebook Page) تملكها
- حساب مطور فيسبوك (Facebook Developer)

### الخطوات

#### 1. إنشاء تطبيق فيسبوك
1. اذهب إلى: https://developers.facebook.com/apps/
2. اضغط **Create App**
3. اختر **Business** → **Next**
4. أدخل اسم التطبيق → **Create**
5. من القائمة اليسرى: **Add Product** → اختر **Messenger** → **Set Up**
6. أيضاً أضف **Webhooks**

#### 2. الحصول على Access Token
1. داخل التطبيق → **Messenger** → **Access Tokens**
2. اضغط **Add or Remove Pages** → اختر صفحتك
3. اضغط **Generate Token** بجانب الصفحة
4. انسخ الـ **Page Access Token**

#### 3. إعداد Webhook

**تشغيل محلي (للاختبار):**
```bash
# استخدم ngrok لإنشاء رابط عام
ngrok http 80
# ستحصل على رابط مثل: https://abc123.ngrok.io
```

**على VPS:**
```
Callback URL: https://your-domain.com/webhook/facebook
Verify Token: chatcta_verify_2024
```

**الاشتراكات المطلوبة (Subscription Fields):**
- `messages`
- `messaging_postbacks`
- `feed` (للتعليقات)

#### 4. إدخال البيانات في لوحة الأدمن
1. افتح: http://your-domain.com/admin → **المنصات**
2. اضغط على **Facebook** → **إعداد**
3. أدخل:
   - **App ID**: من إعدادات التطبيق
   - **App Secret**: من إعدادات التطبيق → Basic
   - **Verify Token**: `chatcta_verify_2024`
4. فعّل المنصة (الزر الأخضر)

#### 5. ربط الصفحة من حساب المستخدم
1. افتح: http://your-domain.com/dashboard → **الصفحات المرتبطة**
2. اضغط **Facebook**
3. ألصق **Page Access Token**
4. اضغط **ربط** → ستظهر صفحاتك تلقائياً

---

## 📸 ربط Instagram

### المتطلبات
- حساب Instagram Business أو Creator
- صفحة فيسبوك مرتبطة بحساب الإنستغرام
- نفس تطبيق فيسبوك (أعلاه)

### الخطوات

#### 1. ربط Instagram بصفحة فيسبوك
1. Instagram → Settings → Account → **Linked Accounts** → Facebook
2. أو: صفحة فيسبوك → Settings → **Instagram** → Connect

#### 2. تفعيل Instagram API في التطبيق
1. في https://developers.facebook.com → التطبيق
2. **Add Product** → **Instagram Basic Display** أو **Instagram Graph API**
3. أضف **Webhooks** → اختر **Instagram**

#### 3. الحصول على Instagram Business Account ID
```bash
# باستخدام الـ Page Access Token
curl "https://graph.facebook.com/v18.0/YOUR_PAGE_ID?fields=instagram_business_account&access_token=YOUR_TOKEN"
```
ستحصل على: `"instagram_business_account": {"id": "17841400xxxxxxxx"}`

#### 4. إعداد Webhook للإنستغرام

**Callback URL:**
```
https://your-domain.com/webhook/instagram
```
**Verify Token:** `chatcta_verify_2024`

**الاشتراكات:**
- `messages`
- `comments`
- `mentions`

#### 5. إدخال البيانات في لوحة الأدمن
1. admin → **المنصات** → **Instagram** → **إعداد**
2. أدخل **App ID** و **App Secret** و **Verify Token**
3. فعّل المنصة

#### 6. ربط من حساب المستخدم
1. dashboard → **الصفحات المرتبطة** → **Instagram**
2. أدخل:
   - **Access Token**: (نفس Page Access Token)
   - **Instagram Business Account ID**: `17841400xxxxxxxx`
3. اضغط **ربط**

---

## 💬 ربط WhatsApp Business

### المتطلبات
- حساب WhatsApp Business Platform (Meta)
- رقم هاتف مخصص للأعمال

### الخطوات

#### 1. إنشاء حساب WhatsApp Business
1. اذهب: https://business.facebook.com/
2. إنشاء Business Account إذا لم يكن لديك
3. في نفس التطبيق على developers.facebook.com:
4. **Add Product** → **WhatsApp** → **Set Up**
5. أكمل إعداد الأعمال

#### 2. الحصول على البيانات المطلوبة
من لوحة WhatsApp في التطبيق:
- **Phone Number ID**: يظهر في Getting Started
- **WhatsApp Business Account ID**: يظهر في Getting Started
- **Permanent Access Token**: System User → Generate Token (بصلاحيات `whatsapp_business_messaging`)

#### 3. إعداد Webhook

**Callback URL:**
```
https://your-domain.com/webhook/whatsapp
```
**Verify Token:** `chatcta_verify_2024`

**الاشتراكات:**
- `messages`

#### 4. إدخال البيانات في لوحة الأدمن
1. admin → **المنصات** → **WhatsApp** → **إعداد**
2. أدخل:
   - **App ID** و **App Secret**
   - **Business Access Token**
   - **Phone Number ID**
   - **Business Account ID**
   - **Verify Token**: `chatcta_verify_2024`
3. فعّل المنصة

#### 5. ربط من حساب المستخدم
1. dashboard → **الصفحات المرتبطة** → **WhatsApp**
2. أدخل:
   - **Phone Number ID**
   - **Access Token**
3. اضغط **ربط**

---

## ✈️ ربط Telegram

### المتطلبات
- بوت تيليجرام (يُنشأ عبر @BotFather)

### الخطوات

#### 1. إنشاء بوت تيليجرام
1. افتح تيليجرام وابحث عن **@BotFather**
2. أرسل: `/newbot`
3. أدخل اسم البوت: `ChatCTA Bot`
4. أدخل username: `chatcta_mystore_bot`
5. ستحصل على **Bot Token** مثل: `7123456789:AAH...xyz`

#### 2. تسجيل Webhook

**تشغيل محلي:**
```bash
ngrok http 80
# ثم:
curl "https://api.telegram.org/bot{YOUR_BOT_TOKEN}/setWebhook?url=https://abc123.ngrok.io/webhook/telegram/{YOUR_BOT_TOKEN}"
```

**على VPS:**
```bash
curl "https://api.telegram.org/bot{YOUR_BOT_TOKEN}/setWebhook?url=https://your-domain.com/webhook/telegram/{YOUR_BOT_TOKEN}"
```

#### 3. التحقق من تسجيل Webhook
```bash
curl "https://api.telegram.org/bot{YOUR_BOT_TOKEN}/getWebhookInfo"
```
يجب أن يظهر `"url": "https://your-domain.com/webhook/telegram/..."` و `"pending_update_count": 0`

#### 4. إدخال البيانات في لوحة الأدمن
1. admin → **المنصات** → **Telegram** → **إعداد**
2. أدخل **Bot Token**
3. فعّل المنصة

#### 5. ربط من حساب المستخدم
1. dashboard → **الصفحات المرتبطة** → **Telegram**
2. أدخل:
   - **Bot Token**: `7123456789:AAH...xyz`
   - **Chat ID** (اختياري - للقنوات): `-1001234567890`
3. اضغط **ربط**

#### الحصول على Chat ID (للقنوات):
1. أضف البوت كمدير في القناة
2. أرسل أي رسالة في القناة
3. افتح: `https://api.telegram.org/bot{TOKEN}/getUpdates`
4. ابحث عن `"chat":{"id":-1001234567890}`

---

## 🎵 ربط TikTok

### المتطلبات
- حساب TikTok Developer
- تطبيق TikTok معتمد

### الخطوات

#### 1. إنشاء تطبيق TikTok
1. اذهب: https://developers.tiktok.com/
2. **Create App** → اختر **Full Application**
3. أكمل البيانات والتحقق (قد يستغرق أيام)
4. بعد القبول: ستحصل على **Client Key** و **Client Secret**

#### 2. إعداد الصلاحيات
في إعدادات التطبيق → **Scopes**:
- `user.info.basic`
- `video.list`
- `comment.list`
- `comment.list.manage`

#### 3. إعداد Webhook (إذا كان متاحاً)

**Callback URL:**
```
https://your-domain.com/webhook/tiktok
```

> **ملاحظة:** TikTok Webhooks حالياً في Beta ومتاح لتطبيقات محددة. قد تحتاج للتقديم للحصول على الوصول.

#### 4. إدخال البيانات في لوحة الأدمن
1. admin → **المنصات** → **TikTok** → **إعداد**
2. أدخل:
   - **Client Key**
   - **Client Secret**
   - **Verify Token**: `chatcta_verify_2024`
3. فعّل المنصة

#### 5. ربط من حساب المستخدم
1. dashboard → **الصفحات المرتبطة** → **TikTok**
2. أدخل:
   - **Access Token**: (من OAuth flow)
   - **Open ID**: (معرف المستخدم)
3. اضغط **ربط**

---

## 🌐 إعداد الويبهوك على VPS

### الخطوة 1: ضبط الدومين
```bash
# تأكد أن الدومين يشير إلى IP السيرفر
# أضف A Record في DNS:
# your-domain.com → YOUR_SERVER_IP
```

### الخطوة 2: تثبيت SSL (مطلوب للويبهوك)
```bash
# أوقف nginx داخل docker مؤقتاً
docker compose down

# ثبت certbot
sudo apt install certbot -y

# احصل على شهادة
sudo certbot certonly --standalone -d your-domain.com

# انسخ الشهادات
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./nginx/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./nginx/ssl/
```

### الخطوة 3: تحديث nginx للـ HTTPS
أنشئ ملف `nginx/nginx-ssl.conf`:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    location /api/ { proxy_pass http://backend:5000/api/; proxy_http_version 1.1; proxy_set_header Host $host; proxy_set_header X-Real-IP $remote_addr; }
    location /webhook/ { proxy_pass http://backend:5000/webhook/; proxy_http_version 1.1; proxy_set_header Host $host; proxy_set_header X-Real-IP $remote_addr; }
    location /socket.io/ { proxy_pass http://backend:5000/socket.io/; proxy_http_version 1.1; proxy_set_header Upgrade $http_upgrade; proxy_set_header Connection "Upgrade"; proxy_set_header Host $host; }
    location /uploads/ { proxy_pass http://backend:5000/uploads/; }
    location / { proxy_pass http://frontend:80/; proxy_http_version 1.1; proxy_set_header Host $host; }
}
```

### الخطوة 4: إعادة التشغيل
```bash
# عدّل .env
FRONTEND_URL=https://your-domain.com

# شغّل
docker compose up -d --build
```

### الخطوة 5: سجّل الويبهوك لكل منصة

| المنصة | Callback URL | Verify Token |
|---|---|---|
| Facebook | `https://your-domain.com/webhook/facebook` | `chatcta_verify_2024` |
| Instagram | `https://your-domain.com/webhook/instagram` | `chatcta_verify_2024` |
| WhatsApp | `https://your-domain.com/webhook/whatsapp` | `chatcta_verify_2024` |
| Telegram | اطلب via API (انظر أعلاه) | — |
| TikTok | `https://your-domain.com/webhook/tiktok` | `chatcta_verify_2024` |

---

## 🧪 اختبار الويبهوك محلياً (ngrok)

```bash
# ثبت ngrok
# https://ngrok.com/download

# شغّل المشروع أولاً
./start.sh

# في نافذة أخرى، شغّل ngrok
ngrok http 80

# ستحصل على رابط مثل:
# https://a1b2c3d4.ngrok.io

# استخدم هذا الرابط كـ Callback URL:
# https://a1b2c3d4.ngrok.io/webhook/facebook
# https://a1b2c3d4.ngrok.io/webhook/instagram
# https://a1b2c3d4.ngrok.io/webhook/whatsapp
```

> ⚠️ **ملاحظة:** رابط ngrok يتغير كل مرة تعيد تشغيله. للاختبار فقط.

---

## 🔗 ميزة إرفاق الروابط

يمكن للمستخدم والأدمن إرفاق **رابط اختياري** مع أي تعليق أو رسالة في البوت:

1. عند إنشاء/تعديل بوت → في قسم **الإجراءات**
2. أسفل نص الرسالة ستجد:
   - **🔗 رابط (اختياري)**: أدخل الرابط الكامل `https://...`
   - **نص الرابط**: نص يظهر مع الرابط (مثل "اضغط هنا")
3. الرابط يُضاف تلقائياً أسفل الرسالة عند الإرسال

---

## 📞 الدعم

- **الدعم الفني**: من داخل المنصة → صفحة الدعم
- **GitHub Issues**: https://github.com/sun9shine/chatcta/issues

---

## 📄 الترخيص

MIT License - استخدم المشروع كما تشاء.
