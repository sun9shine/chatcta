const router = require('express').Router();
const PaymentGateway = require('../models/PaymentGateway');
const Payment = require('../models/Payment');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const { auth, adminOnly } = require('../middleware/auth');

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN: Manage Payment Gateways
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/payments/gateways — list all gateways (admin)
router.get('/gateways', auth, adminOnly, async (req, res) => {
  try {
    const gateways = await PaymentGateway.find().sort('createdAt');
    res.json(gateways);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/payments/gateways — create gateway (admin)
router.post('/gateways', auth, adminOnly, async (req, res) => {
  try {
    const { name, provider, paypal, stripe, custom, currencies, isEnabled } = req.body;
    if (!name || !provider) return res.status(400).json({ error: 'Name and provider required' });

    const gw = await PaymentGateway.create({
      name, provider, isEnabled: isEnabled || false,
      paypal: paypal || {}, stripe: stripe || {}, custom: custom || {},
      currencies: currencies || ['USD'],
      webhookUrl: `${process.env.FRONTEND_URL || 'http://localhost'}/webhook/payment/${provider}`
    });
    res.status(201).json(gw);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/payments/gateways/:id — update gateway (admin)
router.put('/gateways/:id', auth, adminOnly, async (req, res) => {
  try {
    const allowed = ['name', 'provider', 'paypal', 'stripe', 'custom', 'currencies', 'isEnabled'];
    const update = {};
    for (const k of allowed) { if (req.body[k] !== undefined) update[k] = req.body[k]; }
    const gw = await PaymentGateway.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!gw) return res.status(404).json({ error: 'Gateway not found' });
    res.json(gw);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/payments/gateways/:id/toggle — enable/disable (admin)
router.put('/gateways/:id/toggle', auth, adminOnly, async (req, res) => {
  try {
    const gw = await PaymentGateway.findById(req.params.id);
    if (!gw) return res.status(404).json({ error: 'Gateway not found' });
    gw.isEnabled = !gw.isEnabled;
    await gw.save();
    res.json(gw);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/payments/gateways/:id — delete gateway (admin)
router.delete('/gateways/:id', auth, adminOnly, async (req, res) => {
  try {
    await PaymentGateway.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN: Manage Plans (enable/disable plans globally)
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/payments/plans — get plan config
router.get('/plans', async (req, res) => {
  try {
    const plans = Subscription.schema.statics.PLANS;
    // Check if plans are enabled (stored in a simple config)
    const PlatformConfig = require('../models/PlatformConfig');
    const cfg = await PlatformConfig.findOne({ platform: 'payments' });
    const enabledPlans = cfg?.metadata?.enabledPlans || ['free', 'pro', 'enterprise'];
    const planPrices = cfg?.metadata?.planPrices || {};

    const result = {};
    for (const [key, plan] of Object.entries(plans)) {
      result[key] = {
        ...plan,
        price: planPrices[key] !== undefined ? planPrices[key] : plan.price,
        isEnabled: enabledPlans.includes(key)
      };
    }
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/payments/plans — update plan config (admin)
router.put('/plans', auth, adminOnly, async (req, res) => {
  try {
    const { enabledPlans, planPrices } = req.body;
    const PlatformConfig = require('../models/PlatformConfig');
    await PlatformConfig.findOneAndUpdate(
      { platform: 'payments' },
      { platform: 'payments', isEnabled: true, metadata: { enabledPlans, planPrices } },
      { upsert: true, new: true }
    );
    res.json({ message: 'Plans updated', enabledPlans, planPrices });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN: Manual upgrade (free, no payment needed)
// ═══════════════════════════════════════════════════════════════════════════════

router.post('/admin/upgrade', auth, adminOnly, async (req, res) => {
  try {
    const { userId, plan, expiresAt, adminNote } = req.body;
    if (!userId || !plan) return res.status(400).json({ error: 'userId and plan required' });

    // Create payment record
    await Payment.create({
      userId, provider: 'admin', amount: 0, currency: 'USD', plan,
      status: 'completed', isManualUpgrade: true,
      upgradedBy: req.user._id, adminNote: adminNote || 'Admin manual upgrade',
      paidAt: new Date(), expiresAt: expiresAt ? new Date(expiresAt) : null
    });

    // Update subscription
    await Subscription.findOneAndUpdate(
      { userId },
      { plan, status: 'active', upgradedByAdmin: true, upgradedBy: req.user._id,
        adminNote, startedAt: new Date(), expiresAt: expiresAt ? new Date(expiresAt) : null },
      { upsert: true, new: true }
    );

    // Update user plan field
    await User.findByIdAndUpdate(userId, { plan, planExpiresAt: expiresAt ? new Date(expiresAt) : null });

    // Notify user
    if (global.io) global.io.to(userId).emit('plan_upgraded', { plan });

    res.json({ message: `User upgraded to ${plan}` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN: Payment history
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/history', auth, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 30, status, userId } = req.query;
    const q = {};
    if (status) q.status = status;
    if (userId) q.userId = userId;
    const payments = await Payment.find(q)
      .populate('userId', 'name email')
      .populate('gatewayId', 'name provider')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Payment.countDocuments(q);
    res.json({ payments, total });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// USER: Get available gateways (public — only enabled ones, no secrets)
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/available', async (req, res) => {
  try {
    const gateways = await PaymentGateway.find({ isEnabled: true })
      .select('name provider currencies paypal.clientId stripe.publishableKey custom.instructions custom.instructionsAr');
    res.json(gateways);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// USER: Create payment intent
// ═══════════════════════════════════════════════════════════════════════════════

router.post('/create', auth, async (req, res) => {
  try {
    const { gatewayId, plan } = req.body;
    if (!gatewayId || !plan) return res.status(400).json({ error: 'gatewayId and plan required' });

    const gw = await PaymentGateway.findOne({ _id: gatewayId, isEnabled: true });
    if (!gw) return res.status(404).json({ error: 'Gateway not found or disabled' });

    // Get plan price
    const plans = Subscription.schema.statics.PLANS;
    const planInfo = plans[plan];
    if (!planInfo) return res.status(400).json({ error: 'Invalid plan' });

    const payment = await Payment.create({
      userId: req.user._id, gatewayId: gw._id, provider: gw.provider,
      amount: planInfo.price, currency: gw.currencies?.[0] || 'USD', plan, status: 'pending'
    });

    let clientData = {};

    if (gw.provider === 'stripe' && gw.stripe.secretKey) {
      // Create Stripe checkout session
      const stripe = require('stripe')(gw.stripe.secretKey);
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{ price_data: { currency: gw.currencies?.[0] || 'usd', product_data: { name: `ChatCTA ${plan} Plan` }, unit_amount: Math.round(planInfo.price * 100) }, quantity: 1 }],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/dashboard/subscription?success=true&payment=${payment._id}`,
        cancel_url: `${process.env.FRONTEND_URL}/dashboard/subscription?cancelled=true`,
        metadata: { paymentId: payment._id.toString(), userId: req.user._id.toString(), plan }
      });
      payment.transactionId = session.id;
      await payment.save();
      clientData = { sessionId: session.id, url: session.url };

    } else if (gw.provider === 'paypal' && gw.paypal.clientId) {
      // Return client ID for PayPal JS SDK
      clientData = { clientId: gw.paypal.clientId, paymentId: payment._id, amount: planInfo.price, currency: gw.currencies?.[0] || 'USD' };

    } else if (gw.provider === 'manual' || gw.provider === 'custom') {
      clientData = { paymentId: payment._id, instructions: gw.custom.instructions, instructionsAr: gw.custom.instructionsAr };
    }

    res.json({ payment: payment._id, ...clientData });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// USER: Confirm PayPal payment (after client-side approval)
// ═══════════════════════════════════════════════════════════════════════════════

router.post('/confirm-paypal', auth, async (req, res) => {
  try {
    const { paymentId, orderId } = req.body;
    const payment = await Payment.findOne({ _id: paymentId, userId: req.user._id, status: 'pending' });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    const gw = await PaymentGateway.findById(payment.gatewayId);
    if (!gw) return res.status(400).json({ error: 'Gateway not found' });

    // Verify with PayPal API
    const axios = require('axios');
    const auth = Buffer.from(`${gw.paypal.clientId}:${gw.paypal.clientSecret}`).toString('base64');
    const baseUrl = gw.paypal.mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

    const tokenResp = await axios.post(`${baseUrl}/v1/oauth2/token`, 'grant_type=client_credentials', {
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    const accessToken = tokenResp.data.access_token;

    const orderResp = await axios.get(`${baseUrl}/v2/checkout/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (orderResp.data.status === 'COMPLETED' || orderResp.data.status === 'APPROVED') {
      payment.status = 'completed';
      payment.transactionId = orderId;
      payment.paidAt = new Date();
      payment.providerData = orderResp.data;
      await payment.save();

      // Activate subscription
      await activateSubscription(payment);

      // Update gateway stats
      gw.totalPayments += 1;
      gw.totalRevenue += payment.amount;
      gw.lastPaymentAt = new Date();
      await gw.save();

      res.json({ message: 'Payment confirmed', plan: payment.plan });
    } else {
      res.status(400).json({ error: 'Payment not completed on PayPal' });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// WEBHOOKS: Stripe + PayPal
// ═══════════════════════════════════════════════════════════════════════════════

// Stripe Webhook
router.post('/webhook/stripe', require('express').raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const gw = await PaymentGateway.findOne({ provider: 'stripe', isEnabled: true });
    if (!gw || !gw.stripe.webhookSecret) return res.sendStatus(400);

    const stripe = require('stripe')(gw.stripe.secretKey);
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, gw.stripe.webhookSecret);
    } catch (err) {
      console.error('[Stripe Webhook] Signature verification failed:', err.message);
      return res.sendStatus(400);
    }

    console.log('[Stripe Webhook] Event:', event.type);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const payment = await Payment.findById(session.metadata?.paymentId);
      if (payment && payment.status === 'pending') {
        payment.status = 'completed';
        payment.paidAt = new Date();
        payment.transactionId = session.payment_intent;
        payment.providerData = session;
        await payment.save();
        await activateSubscription(payment);
        gw.totalPayments += 1; gw.totalRevenue += payment.amount; gw.lastPaymentAt = new Date();
        await gw.save();
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('[Stripe Webhook] Error:', err.message);
    res.sendStatus(500);
  }
});

// PayPal Webhook
router.post('/webhook/paypal', async (req, res) => {
  res.sendStatus(200);
  try {
    const body = req.body;
    console.log('[PayPal Webhook] Event:', body.event_type);

    if (body.event_type === 'PAYMENT.CAPTURE.COMPLETED' || body.event_type === 'CHECKOUT.ORDER.APPROVED') {
      const orderId = body.resource?.id || body.resource?.supplementary_data?.related_ids?.order_id;
      if (orderId) {
        const payment = await Payment.findOne({ transactionId: orderId, status: 'pending' });
        if (payment) {
          payment.status = 'completed';
          payment.paidAt = new Date();
          payment.providerData = body;
          await payment.save();
          await activateSubscription(payment);

          const gw = await PaymentGateway.findById(payment.gatewayId);
          if (gw) { gw.totalPayments += 1; gw.totalRevenue += payment.amount; gw.lastPaymentAt = new Date(); await gw.save(); }
        }
      }
    }
  } catch (err) {
    console.error('[PayPal Webhook] Error:', err.message);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// Helper: Activate subscription after successful payment
// ═══════════════════════════════════════════════════════════════════════════════

async function activateSubscription(payment) {
  const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000); // 30 days

  await Subscription.findOneAndUpdate(
    { userId: payment.userId },
    { plan: payment.plan, status: 'active', startedAt: new Date(), expiresAt: payment.expiresAt || expiresAt, upgradedByAdmin: payment.isManualUpgrade || false },
    { upsert: true }
  );

  await User.findByIdAndUpdate(payment.userId, { plan: payment.plan, planExpiresAt: payment.expiresAt || expiresAt });

  if (global.io) global.io.to(payment.userId.toString()).emit('plan_upgraded', { plan: payment.plan });
  console.log(`[Payment] Subscription activated: user=${payment.userId} plan=${payment.plan}`);
}

module.exports = router;
