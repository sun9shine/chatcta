const User = require('../models/User');
const bcrypt = require('bcryptjs');

const initAdminAccount = async () => {
  const existing = await User.findOne({ role: 'admin' });
  if (!existing) {
    const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@12345', 12);
    await User.create({
      name: 'Admin',
      email: process.env.ADMIN_EMAIL || 'admin@chatcta.com',
      password: hash,
      role: 'admin',
      isActive: true,
      isVerified: true,
    });
    console.log('✅ Admin account created: admin@chatcta.com / Admin@12345');
  }
};

module.exports = { initAdminAccount };
