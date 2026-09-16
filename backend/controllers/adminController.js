const User = require('../models/User');
const LeaveRequest = require('../models/LeaveRequest');
const statsService = require('../services/statsService');
const leaveService = require('../services/leaveService');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get dashboard statistics for admin
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
const getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await statsService.getDashboardStats();

  res.status(200).json({
    success: true,
    message: 'Dashboard stats fetched',
    data: stats,
  });
});

// @desc    Get all employees and their balances
// @route   GET /api/admin/employees
// @access  Private (Admin)
const getAllEmployees = asyncHandler(async (req, res) => {
  const employees = await User.find({ role: 'employee' })
    .select('name email leaveBalance createdAt')
    .sort({ name: 1 });

  // Format response with defensive fallback values
  const formatted = employees.map((emp) => {
    const casual = emp.leaveBalance?.casual || { total: 12, used: 0 };
    const sick = emp.leaveBalance?.sick || { total: 10, used: 0 };
    const earned = emp.leaveBalance?.earned || { total: 15, used: 0 };

    return {
      id: emp._id,
      name: emp.name,
      email: emp.email,
      createdAt: emp.createdAt,
      leaveBalance: {
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
      },
    };
  });

  res.status(200).json({
    success: true,
    message: 'Employees fetched successfully',
    data: formatted,
  });
});

// @desc    Get all leave requests across organization
// @route   GET /api/admin/leaves
// @access  Private (Admin)
const getAllLeaves = asyncHandler(async (req, res) => {
  const query = {};

  // Sanitize status query parameter against NoSQL injection
  if (req.query.status && typeof req.query.status === 'string') {
    const validStatuses = ['Pending', 'Approved', 'Rejected'];
    if (validStatuses.includes(req.query.status)) {
      query.status = req.query.status;
    }
  }

  const leaves = await LeaveRequest.find(query)
    .populate('employeeId', 'name email')
    .populate('reviewedBy', 'name email')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    message: 'Leave requests fetched successfully',
    data: leaves,
  });
});

// @desc    Get single leave request detail for admin
// @route   GET /api/admin/leaves/:id
// @access  Private (Admin)
const getLeaveDetail = asyncHandler(async (req, res, next) => {
  const leave = await LeaveRequest.findById(req.params.id)
    .populate('employeeId', 'name email leaveBalance')
    .populate('reviewedBy', 'name email');

  if (!leave) {
    return next(new AppError('Leave request not found', 404, 'NOT_FOUND'));
  }

  res.status(200).json({
    success: true,
    message: 'Leave request details fetched',
    data: leave,
  });
});

// @desc    Approve a pending leave request
// @route   PATCH /api/admin/leaves/:id/approve
// @access  Private (Admin)
const approveLeave = asyncHandler(async (req, res) => {
  const updatedRequest = await leaveService.approveLeaveRequest(
    req.params.id,
    req.user.id
  );

  res.status(200).json({
    success: true,
    message: 'Leave request approved successfully',
    data: updatedRequest,
  });
});

// @desc    Reject a pending leave request
// @route   PATCH /api/admin/leaves/:id/reject
// @access  Private (Admin)
const rejectLeave = asyncHandler(async (req, res) => {
  const { rejectionReason } = req.body;

  const updatedRequest = await leaveService.rejectLeaveRequest(
    req.params.id,
    req.user.id,
    rejectionReason
  );

  res.status(200).json({
    success: true,
    message: 'Leave request rejected successfully',
    data: updatedRequest,
  });
});

module.exports = {
  getDashboardStats,
  getAllEmployees,
  getAllLeaves,
  getLeaveDetail,
  approveLeave,
  rejectLeave,
};
