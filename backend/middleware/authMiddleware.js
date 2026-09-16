const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(
        new AppError('Authentication required. Please log in.', 401, 'UNAUTHORIZED')
      );
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new AppError('Token has expired. Please log in again.', 401, 'TOKEN_EXPIRED'));
      }
      return next(new AppError('Invalid token. Please log in again.', 401, 'INVALID_TOKEN'));
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return next(new AppError('User belonging to this token no longer exists.', 401, 'USER_NOT_FOUND'));
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authMiddleware;
