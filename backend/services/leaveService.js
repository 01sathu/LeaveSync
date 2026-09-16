const mongoose = require('mongoose');
const LeaveRequest = require('../models/LeaveRequest');
const User = require('../models/User');
const AppError = require('../utils/AppError');

/**
 * Calculates calendar days inclusive of both start and end dates.
 * Extracts year, month, and day integers directly to avoid any local timezone shift.
 */
const calculateDays = (startDate, endDate) => {
  const startStr = typeof startDate === 'string' ? startDate : new Date(startDate).toISOString();
  const endStr = typeof endDate === 'string' ? endDate : new Date(endDate).toISOString();

  const startParts = startStr.split('T')[0].split('-').map(Number);
  const endParts = endStr.split('T')[0].split('-').map(Number);

  const startUtc = Date.UTC(startParts[0], startParts[1] - 1, startParts[2]);
  const endUtc = Date.UTC(endParts[0], endParts[1] - 1, endParts[2]);

  if (endUtc < startUtc) {
    throw new AppError('End date cannot be before start date', 400, 'INVALID_DATE_RANGE');
  }

  const diffMs = endUtc - startUtc;
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  return days;
};

/**
 * Returns remaining balance for a given leave type for a user.
 */
const getRemainingBalance = (user, leaveType) => {
  const typeKey = leaveType.toLowerCase();
  const category = user.leaveBalance && user.leaveBalance[typeKey];
  if (!category) {
    throw new AppError(`Invalid leave type: ${leaveType}`, 400, 'INVALID_LEAVE_TYPE');
  }
  return category.total - category.used;
};

/**
 * Validates that requested days do not exceed remaining balance.
 */
const validateBalance = (user, leaveType, totalDays) => {
  const remaining = getRemainingBalance(user, leaveType);
  if (totalDays > remaining) {
    throw new AppError(
      `Insufficient leave balance. Requested: ${totalDays} day(s), Available: ${remaining} day(s)`,
      400,
      'INSUFFICIENT_BALANCE'
    );
  }
  return remaining;
};

/**
 * Creates a new leave request with 'Pending' status.
 * Leaves balance unchanged per requirement FR-009.
 */
const createLeaveRequest = async (userId, { leaveType, startDate, endDate, reason }) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  const totalDays = calculateDays(startDate, endDate);
  validateBalance(user, leaveType, totalDays);

  const leaveRequest = await LeaveRequest.create({
    employeeId: user._id,
    leaveType,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    totalDays,
    reason: reason.trim(),
    status: 'Pending',
  });

  return leaveRequest;
};

/**
 * Approves a pending leave request and updates the employee's leave balance.
 * Implements status-guard (409 on non-pending) and defensive balance re-check.
 */
const approveLeaveRequest = async (requestId, adminId) => {
  const leaveRequest = await LeaveRequest.findById(requestId);
  if (!leaveRequest) {
    throw new AppError('Leave request not found', 404, 'NOT_FOUND');
  }

  // Status Guard: only Pending requests can be approved
  if (leaveRequest.status !== 'Pending') {
    throw new AppError(
      `Cannot approve request. It has already been processed with status: ${leaveRequest.status}`,
      409,
      'ALREADY_PROCESSED'
    );
  }

  const employee = await User.findById(leaveRequest.employeeId);
  if (!employee) {
    throw new AppError('Employee associated with this request was not found', 404, 'USER_NOT_FOUND');
  }

  // Defensive re-check: verify balance is still sufficient
  const typeKey = leaveRequest.leaveType.toLowerCase();
  const currentCategory = employee.leaveBalance && employee.leaveBalance[typeKey];
  if (!currentCategory) {
    throw new AppError(`Employee does not have a valid ${leaveRequest.leaveType} leave balance`, 400, 'INVALID_LEAVE_TYPE');
  }

  const remaining = currentCategory.total - currentCategory.used;
  if (leaveRequest.totalDays > remaining) {
    throw new AppError(
      `Cannot approve request: Employee balance has changed. Available: ${remaining} day(s), Requested: ${leaveRequest.totalDays} day(s)`,
      400,
      'INSUFFICIENT_BALANCE'
    );
  }

  // Check if connected MongoDB deployment supports transactions (ReplicaSet or Sharded)
  const topologyType = mongoose.connection.client?.topology?.description?.type;
  const isReplicaSet = topologyType === 'ReplicaSetWithPrimary' || topologyType === 'Sharded';

  let session = null;
  if (isReplicaSet) {
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch (err) {
      session = null;
    }
  }

  try {
    const opts = session ? { session } : {};

    // 1. Re-verify status atomically in the update to protect against concurrent approvals
    const updatedRequest = await LeaveRequest.findOneAndUpdate(
      { _id: leaveRequest._id, status: 'Pending' },
      {
        $set: {
          status: 'Approved',
          reviewedBy: adminId,
          reviewedAt: new Date(),
        },
      },
      { new: true, ...opts }
    );

    if (!updatedRequest) {
      throw new AppError(
        'Request was processed by another action or is no longer pending',
        409,
        'ALREADY_PROCESSED'
      );
    }

    // 2. Increment employee's used leave balance
    await User.findByIdAndUpdate(
      employee._id,
      {
        $inc: {
          [`leaveBalance.${typeKey}.used`]: leaveRequest.totalDays,
        },
      },
      opts
    );

    if (session) {
      await session.commitTransaction();
    }

    return updatedRequest;
  } catch (error) {
    if (session) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

/**
 * Rejects a pending leave request.
 * Leaves balance unchanged per requirement FR-018.
 */
const rejectLeaveRequest = async (requestId, adminId, rejectionReason = null) => {
  const leaveRequest = await LeaveRequest.findById(requestId);
  if (!leaveRequest) {
    throw new AppError('Leave request not found', 404, 'NOT_FOUND');
  }

  // Status Guard: only Pending requests can be rejected
  if (leaveRequest.status !== 'Pending') {
    throw new AppError(
      `Cannot reject request. It has already been processed with status: ${leaveRequest.status}`,
      409,
      'ALREADY_PROCESSED'
    );
  }

  // Atomically update status from Pending to Rejected
  const updatedRequest = await LeaveRequest.findOneAndUpdate(
    { _id: leaveRequest._id, status: 'Pending' },
    {
      $set: {
        status: 'Rejected',
        reviewedBy: adminId,
        reviewedAt: new Date(),
        rejectionReason: rejectionReason ? rejectionReason.trim() : null,
      },
    },
    { new: true }
  );

  if (!updatedRequest) {
    throw new AppError(
      'Request was processed by another action or is no longer pending',
      409,
      'ALREADY_PROCESSED'
    );
  }

  return updatedRequest;
};

module.exports = {
  calculateDays,
  getRemainingBalance,
  validateBalance,
  createLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
};
