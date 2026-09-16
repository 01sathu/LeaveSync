const User = require('../models/User');
const LeaveRequest = require('../models/LeaveRequest');

const getDashboardStats = async () => {
  const [totalEmployees, pending, approved, rejected] = await Promise.all([
    User.countDocuments({ role: 'employee' }),
    LeaveRequest.countDocuments({ status: 'Pending' }),
    LeaveRequest.countDocuments({ status: 'Approved' }),
    LeaveRequest.countDocuments({ status: 'Rejected' }),
  ]);

  return {
    totalEmployees,
    pending,
    approved,
    rejected,
  };
};

module.exports = {
  getDashboardStats,
};
