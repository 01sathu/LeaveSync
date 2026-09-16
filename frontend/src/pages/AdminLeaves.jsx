import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import * as adminService from '../services/adminService';
import StatusBadge from '../components/StatusBadge';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import { formatDate } from '../utils/formatters';
import {
  FileCheck2,
  Filter,
  Check,
  X,
  Eye,
  Search,
} from 'lucide-react';

const AdminLeaves = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentStatus = searchParams.get('status') || '';

  const [leaves, setLeaves] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Modal rejection state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchLeaves = async (status = '') => {
    setLoading(true);
    try {
      const res = await adminService.getAllLeaves(status);
      setLeaves(res.data || []);
    } catch (err) {
      setToast({ message: err.message || 'Failed to fetch leave requests.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves(currentStatus);
  }, [currentStatus]);

  const setStatusFilter = (status) => {
    if (status) {
      setSearchParams({ status });
    } else {
      setSearchParams({});
    }
  };

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await adminService.approveLeave(id);
      setToast({
        message: 'Leave request approved! Employee balance deducted.',
        type: 'success',
      });
      await fetchLeaves(currentStatus);
    } catch (err) {
      setToast({ message: err.message || 'Failed to approve request.', type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (id) => {
    setRejectTargetId(id);
    setRejectionReason('');
    setRejectModalOpen(true);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectTargetId) return;

    setActionLoading(rejectTargetId);
    try {
      await adminService.rejectLeave(rejectTargetId, rejectionReason.trim());
      setToast({
        message: 'Leave request rejected. Balance remains untouched.',
        type: 'info',
      });
      setRejectModalOpen(false);
      await fetchLeaves(currentStatus);
    } catch (err) {
      setToast({ message: err.message || 'Failed to reject request.', type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredLeaves = leaves.filter((leave) => {
    const term = searchTerm.toLowerCase();
    const empName = leave.employeeId?.name?.toLowerCase() || '';
    const empEmail = leave.employeeId?.email?.toLowerCase() || '';
    const reason = leave.reason?.toLowerCase() || '';
    return empName.includes(term) || empEmail.includes(term) || reason.includes(term);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      {/* Header */}
      <div className="pb-6 border-b border-slate-200">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <FileCheck2 className="w-6 h-6 text-indigo-600" />
          Company-Wide Leave Submissions
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Review, approve, or reject employee requests with automated balance updates and auditable logs.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/60 overflow-x-auto">
          {[
            { label: 'All Submissions', value: '' },
            { label: 'Pending Only', value: 'Pending' },
            { label: 'Approved Only', value: 'Approved' },
            { label: 'Rejected Only', value: 'Rejected' },
          ].map((tab) => {
            const isActive = currentStatus === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all duration-150 whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Field */}
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search employee or reason..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition"
          />
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-card overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-56 gap-3">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold text-slate-400">Loading requests...</p>
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <p className="text-sm font-bold text-slate-700">No leave requests found.</p>
            <p className="text-xs text-slate-400 mt-1">
              {currentStatus ? `No records matching status "${currentStatus}".` : 'No requests in system.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200/70">
                <tr>
                  <th className="px-6 py-3.5">Employee</th>
                  <th className="px-6 py-3.5">Leave Type</th>
                  <th className="px-6 py-3.5">Period</th>
                  <th className="px-6 py-3.5">Duration</th>
                  <th className="px-6 py-3.5">Reason</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredLeaves.map((leave) => {
                  const isBusy = actionLoading === leave._id;
                  const isPending = leave.status === 'Pending';

                  return (
                    <tr key={leave._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">
                          {leave.employeeId?.name || 'Unknown'}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          {leave.employeeId?.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{leave.leaveType}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600 font-medium">
                        {formatDate(leave.startDate)} – {formatDate(leave.endDate)}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">{leave.totalDays} day(s)</td>
                      <td className="px-6 py-4 max-w-xs truncate text-xs text-slate-500" title={leave.reason}>
                        {leave.reason}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={leave.status} />
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/admin/leaves/${leave._id}`}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/80 transition"
                            title="Inspect Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {isPending && (
                            <>
                              <button
                                onClick={() => handleApprove(leave._id)}
                                disabled={isBusy}
                                className="inline-flex items-center px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50"
                              >
                                <Check className="w-3.5 h-3.5 mr-1" />
                                Approve
                              </button>
                              <button
                                onClick={() => openRejectModal(leave._id)}
                                disabled={isBusy}
                                className="inline-flex items-center px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50"
                              >
                                <X className="w-3.5 h-3.5 mr-1" />
                                Reject
                              </button>
                            </>
                          )}
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

      {/* Reject Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Leave Request"
      >
        <p className="text-xs text-slate-500 mb-4">
          This will reject the leave request. The employee will be notified via their status badge, and their leave balance will remain completely untouched.
        </p>
        <form onSubmit={handleRejectSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Reason for Rejection (Optional Note)
            </label>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Critical sprint deliverable or overlapping coverage..."
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

export default AdminLeaves;
