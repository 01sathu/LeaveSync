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
    const errorMsg = 'CRITICAL CONFIG ERROR: "MONGO_URI" environment variable is not defined in your environment settings.';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
