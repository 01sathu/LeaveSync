import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as adminService from '../services/adminService';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { formatDate } from '../utils/formatters';
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  FileCheck2,
  ArrowRight,
  AlertCircle,
  Check,
  X,
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, leavesRes] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getAllLeaves('Pending'),
      ]);

      setStats(statsRes.data);
      setPendingLeaves(leavesRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load admin dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id) => {
    setActionLoading(id);
    setError('');
    setSuccessMessage('');
    try {
      await adminService.approveLeave(id);
      setSuccessMessage('Leave request successfully approved and employee balance deducted.');
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to approve request.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Optional: Enter rejection reason for the employee:');
    if (reason === null) return; // cancelled prompt

    setActionLoading(id);
    setError('');
    setSuccessMessage('');
    try {
      await adminService.rejectLeave(id, reason);
      setSuccessMessage('Leave request successfully rejected. Balance remains untouched.');
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to reject request.');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Admin Management Console 🛡️
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Organization-wide leave metrics, approval queues, and employee balance monitoring.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            to="/admin/leaves"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            All Requests
          </Link>
          <Link
            to="/admin/employees"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-xs transition"
          >
            <Users className="w-4 h-4 mr-1.5" />
            Employees List
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between text-sm text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center justify-between text-sm text-rose-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            <span className="font-semibold">{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-rose-600 hover:text-rose-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Organization Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Employees"
          value={stats?.totalEmployees ?? 0}
          subtext="Registered staff members"
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Pending Reviews"
          value={stats?.pending ?? 0}
          subtext="Awaiting admin action"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Approved Requests"
          value={stats?.approved ?? 0}
          subtext="Balances deducted"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Rejected Requests"
          value={stats?.rejected ?? 0}
          subtext="No balance change"
          icon={XCircle}
          color="rose"
        />
      </div>

      {/* Pending Leave Requests Queue */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-semibold text-gray-900">
              Pending Approvals Queue ({pendingLeaves.length})
            </h2>
          </div>
          <Link
            to="/admin/leaves?status=Pending"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            View all pending
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {pendingLeaves.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">All caught up!</p>
            <p className="text-xs text-gray-400 mt-1">
              There are no pending leave requests awaiting approval.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3.5">Employee</th>
                  <th className="px-6 py-3.5">Type</th>
                  <th className="px-6 py-3.5">Dates</th>
                  <th className="px-6 py-3.5">Days</th>
                  <th className="px-6 py-3.5">Reason</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {pendingLeaves.map((leave) => {
                  const isBusy = actionLoading === leave._id;
                  return (
                    <tr key={leave._id} className="hover:bg-gray-50/70 transition">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">
                          {leave.employeeId?.name || 'Unknown Employee'}
                        </div>
                        <div className="text-xs text-gray-400">
                          {leave.employeeId?.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-800">{leave.leaveType}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                        {formatDate(leave.startDate)} – {formatDate(leave.endDate)}
                      </td>
                      <td className="px-6 py-4 font-bold">{leave.totalDays} day(s)</td>
                      <td className="px-6 py-4 max-w-xs truncate text-xs text-gray-500" title={leave.reason}>
                        {leave.reason}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/admin/leaves/${leave._id}`}
                            className="px-2.5 py-1.5 border border-gray-200 text-gray-700 hover:bg-gray-100 text-xs font-semibold rounded-lg transition"
                          >
                            Details
                          </Link>
                          <button
                            onClick={() => handleApprove(leave._id)}
                            disabled={isBusy}
                            className="inline-flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5 mr-1" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(leave._id)}
                            disabled={isBusy}
                            className="inline-flex items-center px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5 mr-1" />
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
