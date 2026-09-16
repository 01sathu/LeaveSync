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

  // Format response with remaining calculations
  const formatted = employees.map((emp) => ({
    id: emp._id,
    name: emp.name,
    email: emp.email,
    createdAt: emp.createdAt,
    leaveBalance: {
      casual: {
        total: emp.leaveBalance.casual.total,
        used: emp.leaveBalance.casual.used,
        remaining: emp.leaveBalance.casual.total - emp.leaveBalance.casual.used,
      },
      sick: {
        total: emp.leaveBalance.sick.total,
        used: emp.leaveBalance.sick.used,
        remaining: emp.leaveBalance.sick.total - emp.leaveBalance.sick.used,
      },
      earned: {
        total: emp.leaveBalance.earned.total,
        used: emp.leaveBalance.earned.used,
        remaining: emp.leaveBalance.earned.total - emp.leaveBalance.earned.used,
      },
    },
  }));

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
  if (req.query.status) {
    query.status = req.query.status;
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
