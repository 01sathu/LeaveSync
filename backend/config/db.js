const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  // Reuse existing connection if already connected (critical for serverless / Vercel)
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  const uri =
    process.env.NODE_ENV === 'test'
      ? process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/leave_management_db'
      : process.env.MONGO_URI;

  if (!uri) {
    console.error('CRITICAL CONFIG ERROR: "MONGO_URI" environment variable is not defined.');
    console.error('Please configure MONGO_URI in your Vercel dashboard or local .env file.');
    return;
  }

  try {
    const conn = await mongoose.connect(uri);
    isConnected = true;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
