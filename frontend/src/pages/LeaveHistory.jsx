import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as leaveService from '../services/leaveService';
import StatusBadge from '../components/StatusBadge';
import { formatDate } from '../utils/formatters';
import { History, PlusCircle, Filter, AlertCircle } from 'lucide-react';

const LeaveHistory = () => {
  const [leaves, setLeaves] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLeaves = async (status = '') => {
    setLoading(true);
    setError('');
    try {
      const res = await leaveService.getMyLeaves(status);
      setLeaves(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch leave history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves(filter);
  }, [filter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <History className="w-6 h-6 text-blue-600" />
            My Leave History
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            View all your past and pending leave requests and their review statuses.
          </p>
        </div>

        <Link
          to="/apply-leave"
          className="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-xs transition"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Apply New Leave
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3 overflow-x-auto">
        <Filter className="w-4 h-4 text-gray-400 shrink-0 ml-1 mr-2" />
        {[
          { label: 'All Requests', value: '' },
          { label: 'Pending', value: 'Pending' },
          { label: 'Approved', value: 'Approved' },
          { label: 'Rejected', value: 'Rejected' },
        ].map((tab) => {
          const isActive = filter === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
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

      {/* Error state */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <p className="text-sm text-rose-700 font-medium">{error}</p>
        </div>
      )}

      {/* Table / List */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : leaves.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <History className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-medium text-gray-700">No leave requests found</p>
            <p className="text-xs text-gray-500 mt-1">
              {filter ? `No requests matching status "${filter}".` : 'You have not submitted any leave requests yet.'}
            </p>
            {!filter && (
              <Link
                to="/apply-leave"
                className="mt-4 inline-flex items-center text-xs font-semibold text-blue-600 hover:underline"
              >
                Apply for leave now →
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3.5">Leave Type</th>
                  <th className="px-6 py-3.5">Duration</th>
                  <th className="px-6 py-3.5">Dates</th>
                  <th className="px-6 py-3.5">Reason</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Review Info</th>
                  <th className="px-6 py-3.5">Applied On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {leaves.map((leave) => (
                  <tr key={leave._id} className="hover:bg-gray-50/70 transition">
                    <td className="px-6 py-4 font-semibold text-gray-900">{leave.leaveType}</td>
                    <td className="px-6 py-4 font-medium text-gray-700">{leave.totalDays} day(s)</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                      {formatDate(leave.startDate)} – {formatDate(leave.endDate)}
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate text-xs text-gray-500" title={leave.reason}>
                      {leave.reason}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={leave.status} />
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {leave.reviewedBy ? (
                        <div>
                          <p className="font-medium text-gray-700">
                            By: {leave.reviewedBy.name || 'Admin'}
                          </p>
                          {leave.rejectionReason && (
                            <p className="text-rose-600 italic mt-0.5" title={leave.rejectionReason}>
                              Note: {leave.rejectionReason}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Pending review</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">
                      {formatDate(leave.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveHistory;
