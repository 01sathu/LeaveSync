const AppError = require('../utils/AppError');

const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          'You do not have permission to access this resource',
          403,
          'FORBIDDEN'
        )
      );
    }
    next();
  };
};

module.exports = roleMiddleware;
