const router = require('express').Router();
const TeamMember = require('../models/TeamMember');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const { auth } = require('../middleware/auth');
const crypto = require('crypto');

router.use(auth);

// Get my team (as owner)
router.get('/', async (req, res) => {
  try {
    const members = await TeamMember.find({ ownerId: req.user._id })
      .populate('memberId', 'name email avatar');
    res.json(members);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get teams I belong to (as member)
router.get('/mine', async (req, res) => {
  try {
    const memberships = await TeamMember.find({ memberId: req.user._id, status: 'active' })
      .populate('ownerId', 'name email avatar plan');
    res.json(memberships);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Invite team member
router.post('/invite', async (req, res) => {
  try {
    const { email, role, permissions } = req.body;

    // Check plan limit
    const sub = await Subscription.findOne({ userId: req.user._id });
    const limit = sub ? sub.getLimit('teamMembers') : 1;
    if (limit !== -1) {
      const count = await TeamMember.countDocuments({ ownerId: req.user._id, status: 'active' });
      if (count >= limit) return res.status(403).json({ error: 'Team member limit reached. Upgrade your plan.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const member = await TeamMember.findOneAndUpdate(
      { ownerId: req.user._id, email },
      {
        ownerId: req.user._id, email, role: role || 'editor',
        permissions, status: 'pending',
        inviteToken: token,
        inviteExpires: new Date(Date.now() + 7 * 24 * 3600 * 1000)
      },
      { upsert: true, new: true }
    );

    // TODO: send email invite with token
    const inviteUrl = `${process.env.FRONTEND_URL}/team/accept/${token}`;
    res.json({ member, inviteUrl });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Accept invite
router.post('/accept/:token', async (req, res) => {
  try {
    const member = await TeamMember.findOne({
      inviteToken: req.params.token,
      inviteExpires: { $gt: new Date() }
    });
    if (!member) return res.status(400).json({ error: 'Invalid or expired invite' });

    member.memberId = req.user._id;
    member.status = 'active';
    member.joinedAt = new Date();
    member.inviteToken = undefined;
    await member.save();

    // Link user to team owner
    await User.findByIdAndUpdate(req.user._id, { teamOwnerId: member.ownerId });

    res.json(member);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update member role/permissions
router.put('/:memberId', async (req, res) => {
  try {
    const member = await TeamMember.findOneAndUpdate(
      { _id: req.params.memberId, ownerId: req.user._id },
      { role: req.body.role, permissions: req.body.permissions },
      { new: true }
    );
    res.json(member);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Remove member
router.delete('/:memberId', async (req, res) => {
  try {
    const member = await TeamMember.findOneAndDelete({ _id: req.params.memberId, ownerId: req.user._id });
    if (member?.memberId) {
      await User.findByIdAndUpdate(member.memberId, { $unset: { teamOwnerId: 1 } });
    }
    res.json({ message: 'Member removed' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
