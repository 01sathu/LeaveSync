const LeaveRequest = require('../models/LeaveRequest');
const leaveService = require('../services/leaveService');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Apply for a new leave request
// @route   POST /api/leaves
// @access  Private (Employee)
const applyLeave = asyncHandler(async (req, res) => {
  const { leaveType, startDate, endDate, reason } = req.body;

  const newRequest = await leaveService.createLeaveRequest(req.user.id, {
    leaveType,
    startDate,
    endDate,
    reason,
  });

  res.status(201).json({
    success: true,
    message: 'Leave request submitted successfully',
    data: newRequest,
  });
});

// @desc    Get logged in employee's leave requests
// @route   GET /api/leaves/my
// @access  Private (Employee)
const getMyLeaves = asyncHandler(async (req, res) => {
  const query = { employeeId: req.user.id };

  // Sanitize status query parameter against NoSQL injection
  if (req.query.status && typeof req.query.status === 'string') {
    const validStatuses = ['Pending', 'Approved', 'Rejected'];
    if (validStatuses.includes(req.query.status)) {
      query.status = req.query.status;
    }
  }

  const leaves = await LeaveRequest.find(query)
    .sort({ createdAt: -1 })
    .populate('reviewedBy', 'name email');

  res.status(200).json({
    success: true,
    message: 'Leave requests fetched successfully',
    data: leaves,
  });
});

// @desc    Get a single leave request by ID (with ownership check)
// @route   GET /api/leaves/:id
// @access  Private (Employee, Admin)
const getLeaveById = asyncHandler(async (req, res, next) => {
  const leaveRequest = await LeaveRequest.findById(req.params.id)
    .populate('employeeId', 'name email')
    .populate('reviewedBy', 'name email');

  if (!leaveRequest) {
    return next(new AppError('Leave request not found', 404, 'NOT_FOUND'));
  }

  // Safe ownership extraction defending against null/deleted employee reference
  const ownerId = leaveRequest.employeeId?._id
    ? leaveRequest.employeeId._id.toString()
    : leaveRequest.employeeId?.toString();

  if (ownerId !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('Leave request not found', 404, 'NOT_FOUND'));
  }

  res.status(200).json({
    success: true,
    message: 'Leave request fetched successfully',
    data: leaveRequest,
  });
});

module.exports = {
  applyLeave,
  getMyLeaves,
  getLeaveById,
};
