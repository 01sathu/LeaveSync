const AppError = require('../utils/AppError');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;
  error.errorCode = err.errorCode || 'SERVER_ERROR';

  // Log server errors for developer debugging (not sent to client)
  if (error.statusCode === 500) {
    console.error('Unhandled Error:', err);
  }

  // Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    error = new AppError('Invalid resource identifier format', 400, 'INVALID_OBJECT_ID');
  }

  // Mongoose Duplicate Key Error (e.g. unique email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    error = new AppError(`A record with this ${field} already exists.`, 400, 'DUPLICATE_FIELD');
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    error = new AppError(messages.join(', '), 400, 'VALIDATION_ERROR');
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token. Please log in again.', 401, 'INVALID_TOKEN');
  }
  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token has expired. Please log in again.', 401, 'TOKEN_EXPIRED');
  }

  res.status(error.statusCode).json({
    success: false,
    message: error.message || 'An unexpected error occurred',
    error: error.errorCode || 'INTERNAL_ERROR',
  });
};

module.exports = errorHandler;
