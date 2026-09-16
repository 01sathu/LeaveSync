const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return next(
        new AppError(`Invalid ${paramName} format`, 400, 'INVALID_OBJECT_ID')
      );
    }
    next();
  };
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(
      new AppError('Please provide both email and password', 400, 'MISSING_FIELDS')
    );
  }
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email.trim())) {
    return next(new AppError('Please provide a valid email address', 400, 'INVALID_EMAIL'));
  }
  next();
};

const validateLeaveApplication = (req, res, next) => {
  const { leaveType, startDate, endDate, reason } = req.body;

  if (!leaveType || !startDate || !endDate || !reason) {
    return next(
      new AppError(
        'Please provide all required fields: leaveType, startDate, endDate, reason',
        400,
        'MISSING_FIELDS'
      )
    );
  }

  const allowedTypes = ['Casual', 'Sick', 'Earned'];
  if (!allowedTypes.includes(leaveType)) {
    return next(
      new AppError(
        `Invalid leave type. Allowed types are: ${allowedTypes.join(', ')}`,
        400,
        'INVALID_LEAVE_TYPE'
      )
    );
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return next(
      new AppError('Please provide valid start and end dates', 400, 'INVALID_DATE')
    );
  }

  const startMidnight = new Date(start.toISOString().split('T')[0]);
  const endMidnight = new Date(end.toISOString().split('T')[0]);

  if (endMidnight < startMidnight) {
    return next(
      new AppError('End date cannot be before start date', 400, 'INVALID_DATE_RANGE')
    );
  }

  if (typeof reason !== 'string' || reason.trim().length === 0) {
    return next(new AppError('Reason cannot be empty', 400, 'INVALID_REASON'));
  }

  if (reason.trim().length > 500) {
    return next(
      new AppError('Reason cannot exceed 500 characters', 400, 'REASON_TOO_LONG')
    );
  }

  next();
};

module.exports = {
  validateObjectId,
  validateLogin,
  validateLeaveApplication,
};
