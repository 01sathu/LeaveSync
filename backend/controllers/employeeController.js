const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get logged in employee profile
// @route   GET /api/employee/profile
// @access  Private (Employee, Admin)
const getProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
  }

  res.status(200).json({
    success: true,
    message: 'Profile fetched successfully',
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

// @desc    Get logged in employee leave balance with derived remaining
// @route   GET /api/employee/leave-balance
// @access  Private (Employee)
const getLeaveBalance = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
  }

  const { casual, sick, earned } = user.leaveBalance;

  const balanceData = {
    casual: {
      total: casual.total,
      used: casual.used,
      remaining: casual.total - casual.used,
    },
    sick: {
      total: sick.total,
      used: sick.used,
      remaining: sick.total - sick.used,
    },
    earned: {
      total: earned.total,
      used: earned.used,
      remaining: earned.total - earned.used,
    },
  };

  res.status(200).json({
    success: true,
    message: 'Leave balance fetched',
    data: balanceData,
  });
});

module.exports = {
  getProfile,
  getLeaveBalance,
};
