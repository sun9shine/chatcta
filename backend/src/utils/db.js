const mongoose = require('mongoose');

const connectDB = async () => {
  const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongo:27017/chatcta');
  console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  return conn;
};

module.exports = connectDB;
