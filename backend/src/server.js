require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./utils/db');
const { initAdminAccount } = require('./utils/initAdmin');

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

// Routes
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

// Webhooks
app.use('/webhook/facebook', require('./webhooks/facebook'));
app.use('/webhook/instagram', require('./webhooks/instagram'));
app.use('/webhook/whatsapp', require('./webhooks/whatsapp'));
app.use('/webhook/telegram', require('./webhooks/telegram'));
app.use('/webhook/tiktok', require('./webhooks/tiktok'));

// Upload endpoint (for admin publish)
const upload = require('./middleware/upload');
const { auth, adminOnly } = require('./middleware/auth');
app.post('/api/upload', auth, adminOnly, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', version: '1.0.0' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  await initAdminAccount();
  server.listen(PORT, () => {
    console.log(`🚀 ChatCTA Backend running on port ${PORT}`);
  });
}).catch(err => {
  console.error('DB connection failed:', err);
  process.exit(1);
});
