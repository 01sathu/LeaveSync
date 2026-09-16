import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import * as adminService from '../services/adminService';
import StatusBadge from '../components/StatusBadge';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import { formatDate } from '../utils/formatters';
import {
  ArrowLeft,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Check,
  X,
  FileText,
  ShieldAlert,
} from 'lucide-react';

const AdminLeaveDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [leave, setLeave] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await adminService.getLeaveDetail(id);
      setLeave(res.data);
    } catch (err) {
      setToast({ message: err.message || 'Failed to fetch leave details.', type: 'error' });
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
    try {
      await adminService.approveLeave(id);
      setToast({
        message: 'Leave request approved! Employee balance has been deducted.',
        type: 'success',
      });
      await fetchDetail();
    } catch (err) {
      setToast({ message: err.message || 'Failed to approve leave request.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await adminService.rejectLeave(id, rejectionReason.trim());
      setToast({
        message: 'Leave request rejected. Balance remains unaffected.',
        type: 'info',
      });
      setRejectModalOpen(false);
      await fetchDetail();
    } catch (err) {
      setToast({ message: err.message || 'Failed to reject leave request.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-400">Loading audit details...</p>
        </div>
      </div>
    );
  }

  if (!leave) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-10 space-y-4">
        <Link
          to="/admin/leaves"
          className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Back to Leave Requests
        </Link>
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-rose-800">Leave request not found or invalid identifier.</p>
        </div>
      </div>
    );
  }

  const employee = leave.employeeId;
  const isPending = leave.status === 'Pending';
  const typeKey = leave.leaveType?.toLowerCase();
  const empBalance = employee?.leaveBalance && employee.leaveBalance[typeKey];
  const remainingDays = empBalance ? empBalance.total - empBalance.used : 0;
  const hasSufficientBalance = remainingDays >= (leave.totalDays || 0);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      {/* Back button */}
      <Link
        to="/admin/leaves"
        className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
        Back to Leave Submissions
      </Link>

      {/* Main Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-card overflow-hidden">
        {/* Header */}
        <div className="px-6 sm:px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Request Audit #{leave._id.slice(-6)}
              </h1>
              <StatusBadge status={leave.status} />
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              ObjectId: {leave._id}
            </p>
          </div>

          {isPending && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleApprove}
                disabled={actionLoading || !hasSufficientBalance}
                className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-40 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition"
              >
                <Check className="w-4 h-4 mr-1.5" />
                Approve Request
              </button>
              <button
                onClick={() => setRejectModalOpen(true)}
                disabled={actionLoading}
                className="inline-flex items-center px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] disabled:opacity-40 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition"
              >
                <X className="w-4 h-4 mr-1.5" />
                Reject Request
              </button>
            </div>
          )}
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Employee Profile Box */}
          <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-5 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              Employee Information & Balance Overview
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <p className="text-[11px] font-medium text-slate-400">Employee Name</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{employee?.name}</p>
              </div>

              <div>
                <p className="text-[11px] font-medium text-slate-400">Work Email</p>
                <p className="text-sm font-mono text-slate-700 mt-0.5">{employee?.email}</p>
              </div>

              <div>
                <p className="text-[11px] font-medium text-slate-400">
                  {leave.leaveType} Balance Status
                </p>
                <p className={`text-sm font-bold mt-0.5 ${hasSufficientBalance ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {remainingDays} days available
                  <span className="text-xs font-normal text-slate-500 block">
                    (Used {empBalance?.used || 0} of {empBalance?.total || 0} days)
                  </span>
                </p>
              </div>
            </div>

            {!hasSufficientBalance && isPending && (
              <div className="mt-2 bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-2 text-xs font-semibold text-rose-800">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Employee does not have enough remaining quota to cover this duration.</span>
              </div>
            )}
          </div>

          {/* Request Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="border border-slate-200 rounded-2xl p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Category</p>
              <p className="text-base font-extrabold text-slate-900 mt-1">{leave.leaveType} Leave</p>
            </div>

            <div className="border border-slate-200 rounded-2xl p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Duration Requested</p>
              <p className="text-base font-extrabold text-slate-900 mt-1">{leave.totalDays} Calendar Day(s)</p>
            </div>

            <div className="border border-slate-200 rounded-2xl p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Leave Period</p>
              <p className="text-xs font-bold text-slate-700 mt-1.5">
                {formatDate(leave.startDate)} to {formatDate(leave.endDate)}
              </p>
            </div>
          </div>

          {/* Reason Section */}
          <div className="border border-slate-200 rounded-2xl p-5 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Employee Absence Reason
            </p>
            <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{leave.reason}</p>
          </div>

          {/* Review Audit Box (if processed) */}
          {!isPending && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Decision Audit Record
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400">Action Taken By:</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">
                    {leave.reviewedBy?.name || 'Administrator'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Action Timestamp:</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">
                    {formatDate(leave.reviewedAt)}
                  </p>
                </div>
              </div>
              {leave.rejectionReason && (
                <div className="pt-3 border-t border-slate-200">
                  <span className="text-xs font-bold text-rose-600">Rejection Reason Given:</span>
                  <p className="text-sm text-rose-700 italic mt-0.5">{leave.rejectionReason}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Leave Request"
      >
        <p className="text-xs text-slate-500 mb-4">
          This action will reject the request. The employee will see the updated status in their history. Their leave balance will remain completely unaffected.
        </p>

        <form onSubmit={handleRejectSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Optional Note / Rejection Reason
            </label>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Schedule conflicts or insufficient coverage..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setRejectModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition"
            >
              Confirm Rejection
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminLeaveDetail;
