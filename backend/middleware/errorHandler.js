const AppError = require('../utils/AppError');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let errorCode = err.errorCode || 'SERVER_ERROR';
  let message = err.message || 'An unexpected error occurred';

  // Handle malformed JSON request bodies from express.json()
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    errorCode = 'INVALID_JSON';
    message = 'Malformed JSON payload in request body';
  }

  // Mongoose Bad ObjectId (CastError)
  else if (err.name === 'CastError') {
    statusCode = 400;
    errorCode = 'INVALID_OBJECT_ID';
    message = 'Invalid resource identifier format';
  }

  // Mongoose Duplicate Key Error (e.g. unique email)
  else if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    statusCode = 400;
    errorCode = 'DUPLICATE_FIELD';
    message = `A record with this ${field} already exists.`;
  }

  // Mongoose Validation Error
  else if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors || {}).map((val) => val.message);
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = messages.join(', ');
  }

  // JWT Errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'INVALID_TOKEN';
    message = 'Invalid authentication token. Please log in again.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired. Please log in again.';
  }

  // Log 500 errors server-side for developer debugging
  if (statusCode === 500) {
    console.error('Server Internal Error:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    error: errorCode,
  });
};

module.exports = errorHandler;
