const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const connectDB = require('./config/db');
const AppError = require('./utils/AppError');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Database connection
if (!process.env.VERCEL) {
  connectDB();
}

// Serverless DB connection middleware (ensures connection is established before handling request)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(new AppError('Database connection failure. Please verify MONGO_URI.', 500, 'DB_CONNECTION_ERROR'));
  }
});

// CORS configuration supporting comma-separated lists, wildcards, and vercel preview domains
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((url) => url.trim().replace(/\/$/, ''));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, Postman, server-to-server)
      if (!origin) return callback(null, true);

      // In development or if wildcard is configured, allow all
      if (process.env.NODE_ENV !== 'production' || allowedOrigins.includes('*')) {
        return callback(null, true);
      }

      const cleanOrigin = origin.replace(/\/$/, '');
      const isAllowed =
        allowedOrigins.includes(cleanOrigin) ||
        (cleanOrigin.endsWith('.vercel.app') && allowedOrigins.some((url) => url.includes('vercel.app')));

      if (isAllowed) {
        return callback(null, true);
      }

      callback(new AppError(`Origin ${origin} is not allowed by CORS policy`, 403, 'CORS_ERROR'));
    },
    credentials: true,
  })
);

// Body parser
app.use(express.json());

// Request logging (skip during tests)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Leave Management System API is healthy',
    timestamp: new Date().toISOString(),
  });
});

// Mount application routes
app.use('/api/auth', authRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/admin', adminRoutes);

// Catch-all 404 handler for undefined routes
app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404, 'NOT_FOUND'));
});

// Centralized error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Leave Management System Server running on port ${PORT}`);
  });
}

module.exports = app;
