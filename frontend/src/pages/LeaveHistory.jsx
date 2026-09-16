import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as leaveService from '../services/leaveService';
import StatusBadge from '../components/StatusBadge';
import { formatDate } from '../utils/formatters';
import { History, PlusCircle, Filter, AlertCircle, Search, Calendar, CheckCircle2, User } from 'lucide-react';

const LeaveHistory = () => {
  const [leaves, setLeaves] = useState([]);
  const [filter, setFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
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

  const filteredLeaves = leaves.filter((leave) => {
    const term = searchTerm.toLowerCase();
    return (
      leave.leaveType.toLowerCase().includes(term) ||
      (leave.reason && leave.reason.toLowerCase().includes(term))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <History className="w-6 h-6 text-indigo-600" />
            My Leave Records
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            A complete audit history of all your submitted leave requests and approval decisions.
          </p>
        </div>

        <Link
          to="/apply-leave"
          className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-glow-brand transition active:scale-[0.98]"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Apply New Leave
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/60 overflow-x-auto">
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
            placeholder="Search by type or reason..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition"
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <p className="text-xs font-semibold text-rose-700">{error}</p>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-card overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-56 gap-3">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold text-slate-400">Loading records...</p>
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Calendar className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-bold text-slate-700">No matching leave requests</p>
            <p className="text-xs text-slate-400 mt-1">
              {filter ? `No requests with status "${filter}".` : 'You have not submitted any leave requests yet.'}
            </p>
            {!filter && (
              <Link
                to="/apply-leave"
                className="mt-3 inline-flex items-center text-xs font-bold text-indigo-600 hover:underline"
              >
                Apply for leave now →
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200/70">
                <tr>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Duration</th>
                  <th className="px-6 py-3.5">Date Period</th>
                  <th className="px-6 py-3.5">Reason</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Audit Note</th>
                  <th className="px-6 py-3.5">Applied Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredLeaves.map((leave) => (
                  <tr key={leave._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{leave.leaveType}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {leave.totalDays} day(s)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600 font-medium">
                      {formatDate(leave.startDate)} – {formatDate(leave.endDate)}
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate text-xs text-slate-500" title={leave.reason}>
                      {leave.reason}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={leave.status} />
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {leave.reviewedBy ? (
                        <div>
                          <p className="font-semibold text-slate-700">
                            Reviewed by: {leave.reviewedBy.name || 'Admin'}
                          </p>
                          {leave.rejectionReason && (
                            <p className="text-rose-600 italic text-[11px] mt-0.5" title={leave.rejectionReason}>
                              Note: {leave.rejectionReason}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Awaiting review</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400 font-medium">
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
