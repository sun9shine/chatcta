require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const cron = require('node-cron');
const connectDB = require('./utils/db');
const { initAdminAccount } = require('./utils/initAdmin');
const { initTemplates } = require('./utils/initTemplates');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static('uploads'));

// Socket.io
global.io = io;
io.on('connection', (socket) => {
  socket.on('join', (userId) => socket.join(userId));
  socket.on('disconnect', () => {});
});

// ─── Routes ───────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/pages', require('./routes/pages'));
app.use('/api/bots', require('./routes/bots'));
app.use('/api/flows', require('./routes/flows'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/platforms', require('./routes/platforms'));
app.use('/api/smtp', require('./routes/smtp'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/privacy', require('./routes/privacy'));
app.use('/api/support', require('./routes/support'));
app.use('/api/analytics', require('./routes/analytics'));
// New features
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/scheduled', require('./routes/scheduled'));
app.use('/api/abtests', require('./routes/abtests'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/team', require('./routes/team'));
app.use('/api/conversions', require('./routes/conversions'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/translate', require('./routes/translate'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/ai-settings', require('./routes/aiSettings'));
app.use('/api/payments', require('./routes/payments'));

// ─── Webhooks ─────────────────────────────────────────
app.use('/webhook/facebook', require('./webhooks/facebook'));
app.use('/webhook/instagram', require('./webhooks/instagram'));
app.use('/webhook/whatsapp', require('./webhooks/whatsapp'));
app.use('/webhook/telegram', require('./webhooks/telegram'));
app.use('/webhook/tiktok', require('./webhooks/tiktok'));

// Payment webhooks (Stripe needs raw body, registered separately)
app.use('/webhook/payment/stripe', require('express').raw({ type: 'application/json' }));
app.post('/webhook/payment/stripe', async (req, res) => {
  // Forward to payments route handler
  const paymentsRouter = require('./routes/payments');
  req.url = '/webhook/stripe';
  paymentsRouter.handle(req, res);
});
app.post('/webhook/payment/paypal', async (req, res) => {
  const paymentsRouter = require('./routes/payments');
  req.url = '/webhook/paypal';
  paymentsRouter.handle(req, res);
});

// GET /webhook — root health check (confirms webhooks are active)
app.get('/webhook', (req, res) => {
  res.json({
    status: 'ok',
    message: 'ChatCTA Webhook Server Active',
    endpoints: {
      facebook:  '/webhook/facebook',
      instagram: '/webhook/instagram',
      whatsapp:  '/webhook/whatsapp',
      telegram:  '/webhook/telegram/:botToken',
      tiktok:    '/webhook/tiktok'
    },
    note: 'GET = verification, POST = receive events'
  });
});

// ─── Upload endpoint ──────────────────────────────────
const upload = require('./middleware/upload');
const { auth, adminOnly } = require('./middleware/auth');
app.post('/api/upload', auth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

// ─── Conversion tracking pixel ────────────────────────
app.get('/track/:trackingId', async (req, res) => {
  // 1x1 transparent GIF
  const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  res.set('Content-Type', 'image/gif');
  res.set('Cache-Control', 'no-store');
  res.send(pixel);
  // Record conversion asynchronously
  try {
    const Conversion = require('./models/Conversion');
    await Conversion.findOneAndUpdate(
      { trackingId: req.params.trackingId },
      { eventType: 'link_click' },
      { new: false }
    );
  } catch (e) {}
});

// ─── Health check ─────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', version: '2.0.0' }));

// ─── Error handler ────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// ─── Scheduled Jobs ───────────────────────────────────
const runScheduledPosts = require('./utils/scheduler');

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  await initAdminAccount();
  await initTemplates();

  // Run scheduled posts every minute
  cron.schedule('* * * * *', () => {
    runScheduledPosts().catch(console.error);
  });

  // Reset monthly usage on 1st of each month
  cron.schedule('0 0 1 * *', async () => {
    try {
      const Subscription = require('./models/Subscription');
      await Subscription.updateMany({}, {
        'usageThisMonth.messages': 0,
        'usageThisMonth.resetAt': new Date(Date.now() + 30 * 24 * 3600 * 1000)
      });
      console.log('✅ Monthly usage reset');
    } catch (e) { console.error('Monthly reset error:', e.message); }
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 ChatCTA v2.0 Backend running on 0.0.0.0:${PORT}`);
    console.log(`📡 Webhooks ready at /webhook/facebook, /webhook/instagram, /webhook/whatsapp, /webhook/telegram, /webhook/tiktok`);
  });
}).catch(err => {
  console.error('DB connection failed:', err);
  process.exit(1);
});
