const router = require('express').Router();
const nodemailer = require('nodemailer');
const SmtpConfig = require('../models/SmtpConfig');
const { auth, adminOnly } = require('../middleware/auth');

router.use(auth, adminOnly);

router.get('/', async (req, res) => {
  try {
    const config = await SmtpConfig.findOne();
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/', async (req, res) => {
  try {
    const config = await SmtpConfig.findOneAndUpdate({}, req.body, { upsert: true, new: true });
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/test', async (req, res) => {
  try {
    const config = await SmtpConfig.findOne();
    if (!config) return res.status(400).json({ error: 'No SMTP config found' });
    const transporter = nodemailer.createTransport({
      host: config.host, port: config.port, secure: config.secure,
      auth: { user: config.user, pass: config.password }
    });
    await transporter.verify();
    config.lastTested = new Date(); config.testStatus = 'success'; await config.save();
    res.json({ message: 'SMTP connection successful' });
  } catch (err) {
    const config = await SmtpConfig.findOne();
    if (config) { config.testStatus = 'failed'; await config.save(); }
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
