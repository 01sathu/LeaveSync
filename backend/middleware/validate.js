const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    // Exact 24-character hexadecimal check to reject arbitrary strings
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id) || !mongoose.Types.ObjectId.isValid(id)) {
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
  if (typeof email !== 'string' || !emailRegex.test(email.trim())) {
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

  // Verify dates are valid strings
  if (typeof startDate !== 'string' || typeof endDate !== 'string') {
    return next(new AppError('Dates must be valid date strings', 400, 'INVALID_DATE'));
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return next(
      new AppError('Please provide valid start and end dates', 400, 'INVALID_DATE')
    );
  }

  const startParts = startDate.split('T')[0].split('-').map(Number);
  const endParts = endDate.split('T')[0].split('-').map(Number);

  if (startParts.length !== 3 || endParts.length !== 3) {
    return next(new AppError('Dates must be formatted as YYYY-MM-DD', 400, 'INVALID_DATE'));
  }

  const startUtc = Date.UTC(startParts[0], startParts[1] - 1, startParts[2]);
  const endUtc = Date.UTC(endParts[0], endParts[1] - 1, endParts[2]);

  if (endUtc < startUtc) {
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

const validateRejection = (req, res, next) => {
  const { rejectionReason } = req.body;
  if (rejectionReason && typeof rejectionReason === 'string' && rejectionReason.trim().length > 500) {
    return next(
      new AppError('Rejection reason cannot exceed 500 characters', 400, 'REASON_TOO_LONG')
    );
  }
  next();
};

module.exports = {
  validateObjectId,
  validateLogin,
  validateLeaveApplication,
  validateRejection,
};
