import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as adminService from '../services/adminService';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
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
  Shield,
  Eye,
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Modal rejection state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, leavesRes] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getAllLeaves('Pending'),
      ]);

      setStats(statsRes.data);
      setPendingLeaves(leavesRes.data || []);
    } catch (err) {
      setToast({ message: err.message || 'Failed to load dashboard data.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await adminService.approveLeave(id);
      setToast({
        message: 'Leave request approved! Employee balance has been deducted.',
        type: 'success',
      });
      await loadData();
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
        message: 'Leave request rejected. Employee balance remains unchanged.',
        type: 'info',
      });
      setRejectModalOpen(false);
      await loadData();
    } catch (err) {
      setToast({ message: err.message || 'Failed to reject request.', type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-400">Loading admin console...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Shield className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Administrative Control
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Executive Leave Management
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Monitor company-wide employee balances and process pending leave approval requests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/leaves"
            className="inline-flex items-center px-4 py-2.5 border border-slate-200 hover:border-slate-300 bg-white text-slate-700 text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition"
          >
            All Requests
          </Link>
          <Link
            to="/admin/employees"
            className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-glow-brand transition active:scale-[0.98]"
          >
            <Users className="w-4 h-4 mr-1.5" />
            View Employees
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Staff"
          value={stats?.totalEmployees ?? 0}
          subtext="Active organization members"
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Pending Queue"
          value={stats?.pending ?? 0}
          subtext="Requires immediate review"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Approved Leave"
          value={stats?.approved ?? 0}
          subtext="Deducted from balance"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Rejected Leave"
          value={stats?.rejected ?? 0}
          subtext="No balance impact"
          icon={XCircle}
          color="rose"
        />
      </div>

      {/* Pending Queue Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-card overflow-hidden">
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-bold text-slate-800">
              Pending Approvals Queue ({pendingLeaves.length})
            </h2>
          </div>
          <Link
            to="/admin/leaves?status=Pending"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition"
          >
            Full Queue
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {pendingLeaves.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <CheckCircle2 className="w-10 h-10 text-emerald-500/80 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-800">All caught up!</p>
            <p className="text-xs text-slate-400 mt-1">
              There are no pending leave applications awaiting administrator action.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200/70">
                <tr>
                  <th className="px-6 py-3.5">Employee</th>
                  <th className="px-6 py-3.5">Leave Type</th>
                  <th className="px-6 py-3.5">Dates</th>
                  <th className="px-6 py-3.5">Duration</th>
                  <th className="px-6 py-3.5">Reason</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {pendingLeaves.map((leave) => {
                  const isBusy = actionLoading === leave._id;
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
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/admin/leaves/${leave._id}`}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/80 transition"
                            title="Inspect Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleApprove(leave._id)}
                            disabled={isBusy}
                            className="inline-flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5 mr-1" />
                            Approve
                          </button>
                          <button
                            onClick={() => openRejectModal(leave._id)}
                            disabled={isBusy}
                            className="inline-flex items-center px-3 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50"
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
              placeholder="e.g., Uncovered schedule or overlap with quarterly deliverable..."
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

export default AdminDashboard;
