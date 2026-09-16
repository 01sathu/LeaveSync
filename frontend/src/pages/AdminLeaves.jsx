import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import * as adminService from '../services/adminService';
import StatusBadge from '../components/StatusBadge';
import { formatDate } from '../utils/formatters';
import {
  FileCheck2,
  Filter,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  Eye,
} from 'lucide-react';

const AdminLeaves = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentStatus = searchParams.get('status') || '';

  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchLeaves = async (status = '') => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getAllLeaves(status);
      setLeaves(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch leave requests.');
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
    setError('');
    setSuccessMessage('');
    try {
      await adminService.approveLeave(id);
      setSuccessMessage('Leave request successfully approved and employee balance updated.');
      await fetchLeaves(currentStatus);
    } catch (err) {
      setError(err.message || 'Failed to approve request.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Optional: Enter rejection reason for the employee:');
    if (reason === null) return;

    setActionLoading(id);
    setError('');
    setSuccessMessage('');
    try {
      await adminService.rejectLeave(id, reason);
      setSuccessMessage('Leave request successfully rejected. Balance remains unchanged.');
      await fetchLeaves(currentStatus);
    } catch (err) {
      setError(err.message || 'Failed to reject request.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="pb-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileCheck2 className="w-6 h-6 text-blue-600" />
          All Organization Leave Requests
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Review, approve, or reject employee time-off requests with real-time balance integrity.
        </p>
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

      {/* Status Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3 overflow-x-auto">
        <Filter className="w-4 h-4 text-gray-400 shrink-0 ml-1 mr-2" />
        {[
          { label: 'All Requests', value: '' },
          { label: 'Pending Only', value: 'Pending' },
          { label: 'Approved Only', value: 'Approved' },
          { label: 'Rejected Only', value: 'Rejected' },
        ].map((tab) => {
          const isActive = currentStatus === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Requests Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : leaves.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <p className="text-sm font-medium text-gray-700">No leave requests found.</p>
            <p className="text-xs text-gray-500 mt-1">
              {currentStatus ? `No records with status "${currentStatus}".` : 'No requests have been submitted yet.'}
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
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {leaves.map((leave) => {
                  const isBusy = actionLoading === leave._id;
                  const isPending = leave.status === 'Pending';

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
                      <td className="px-6 py-4">
                        <StatusBadge status={leave.status} />
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/admin/leaves/${leave._id}`}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="View Full Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {isPending && (
                            <>
                              <button
                                onClick={() => handleApprove(leave._id)}
                                disabled={isBusy}
                                className="inline-flex items-center px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition disabled:opacity-50"
                              >
                                <Check className="w-3.5 h-3.5 mr-1" />
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(leave._id)}
                                disabled={isBusy}
                                className="inline-flex items-center px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition disabled:opacity-50"
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
    </div>
  );
};

export default AdminLeaves;
