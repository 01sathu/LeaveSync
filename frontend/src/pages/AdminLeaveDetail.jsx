import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import * as adminService from '../services/adminService';
import StatusBadge from '../components/StatusBadge';
import { formatDate } from '../utils/formatters';
import {
  ArrowLeft,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Check,
  X,
  FileText,
} from 'lucide-react';

const AdminLeaveDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [leave, setLeave] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getLeaveDetail(id);
      setLeave(res.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch leave request details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleApprove = async () => {
    if (!window.confirm('Are you sure you want to approve this leave request? This will deduct the balance.')) {
      return;
    }

    setActionLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      await adminService.approveLeave(id);
      setSuccessMessage('Leave request successfully approved! Balance has been deducted.');
      await fetchDetail();
    } catch (err) {
      setError(err.message || 'Failed to approve leave request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      await adminService.rejectLeave(id, rejectionReason.trim());
      setSuccessMessage('Leave request rejected. Balance remains unaffected.');
      setShowRejectModal(false);
      await fetchDetail();
    } catch (err) {
      setError(err.message || 'Failed to reject leave request.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error && !leave) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        <Link
          to="/admin/leaves"
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Leave Requests
        </Link>
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <p className="text-rose-700 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  const employee = leave?.employeeId;
  const isPending = leave?.status === 'Pending';
  const typeKey = leave?.leaveType?.toLowerCase();
  const empBalance = employee?.leaveBalance && employee.leaveBalance[typeKey];
  const remainingDays = empBalance ? empBalance.total - empBalance.used : 0;
  const hasSufficientBalance = remainingDays >= (leave?.totalDays || 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back button */}
      <Link
        to="/admin/leaves"
        className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" />
        Back to Leave Requests
      </Link>

      {/* Notifications */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 text-sm text-emerald-800">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center gap-3 text-sm text-rose-800">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Main Detail Card */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">
                Leave Request Details
              </h1>
              <StatusBadge status={leave?.status} />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Request ID: <span className="font-mono text-gray-700">{leave?._id}</span>
            </p>
          </div>

          {/* Action buttons if Pending */}
          {isPending && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleApprove}
                disabled={actionLoading || !hasSufficientBalance}
                className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-xs transition"
              >
                <Check className="w-4 h-4 mr-1.5" />
                Approve Request
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={actionLoading}
                className="inline-flex items-center px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-xs transition"
              >
                <X className="w-4 h-4 mr-1.5" />
                Reject Request
              </button>
            </div>
          )}
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Employee & Balances Section */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-gray-400" />
              Employee Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500">Employee Name</p>
                <p className="font-bold text-gray-900 mt-0.5">{employee?.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Email Address</p>
                <p className="font-medium text-gray-700 mt-0.5">{employee?.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Current {leave?.leaveType} Balance</p>
                <p className={`font-bold mt-0.5 ${hasSufficientBalance ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {remainingDays} days available
                  <span className="text-xs font-normal text-gray-500 block">
                    (Total: {empBalance?.total || 0}, Used: {empBalance?.used || 0})
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Leave Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            <div className="border border-gray-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Leave Type</p>
              <p className="text-base font-bold text-gray-900 mt-1">{leave?.leaveType} Leave</p>
            </div>

            <div className="border border-gray-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Requested Duration</p>
              <p className="text-base font-bold text-gray-900 mt-1">{leave?.totalDays} Calendar Day(s)</p>
            </div>

            <div className="border border-gray-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Leave Period</p>
              <p className="text-sm font-semibold text-gray-800 mt-1">
                {formatDate(leave?.startDate)} to {formatDate(leave?.endDate)}
              </p>
            </div>

            <div className="border border-gray-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Submitted On</p>
              <p className="text-sm text-gray-700 mt-1">{formatDate(leave?.createdAt)}</p>
            </div>
          </div>

          {/* Reason */}
          <div className="border border-gray-200 rounded-xl p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-gray-400" />
              Employee Reason
            </p>
            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{leave?.reason}</p>
          </div>

          {/* Review Audit Box (if processed) */}
          {!isPending && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Review Audit Information
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs text-gray-400">Reviewed By:</span>
                  <p className="font-semibold text-gray-800">{leave?.reviewedBy?.name || 'Administrator'}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-400">Reviewed At:</span>
                  <p className="font-semibold text-gray-800">{formatDate(leave?.reviewedAt)}</p>
                </div>
              </div>
              {leave?.rejectionReason && (
                <div className="pt-2 border-t border-gray-200">
                  <span className="text-xs text-rose-600 font-semibold">Rejection Note:</span>
                  <p className="text-sm text-rose-700 italic mt-0.5">{leave.rejectionReason}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Reject Leave Request</h3>
              <button
                onClick={() => setShowRejectModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-500">
              The request will be marked as Rejected. The employee's leave balance will remain completely unaffected.
            </p>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Reason for Rejection (Optional)
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Critical project deadline during this week..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition"
                >
                  {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLeaveDetail;
