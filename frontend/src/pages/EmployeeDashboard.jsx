import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as employeeService from '../services/employeeService';
import * as leaveService from '../services/leaveService';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { formatDate } from '../utils/formatters';
import {
  CalendarDays,
  HeartPulse,
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  PlusCircle,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(null);
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [balanceRes, leavesRes] = await Promise.all([
        employeeService.getLeaveBalance(),
        leaveService.getMyLeaves(),
      ]);

      const balanceData = balanceRes.data;
      const leavesData = leavesRes.data || [];

      setBalance(balanceData);
      setRecentLeaves(leavesData.slice(0, 5));

      const pending = leavesData.filter((l) => l.status === 'Pending').length;
      const approved = leavesData.filter((l) => l.status === 'Approved').length;
      const rejected = leavesData.filter((l) => l.status === 'Rejected').length;
      setCounts({ pending, approved, rejected });
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <p className="text-rose-700 font-medium">{error}</p>
          <button
            onClick={loadDashboardData}
            className="mt-4 px-4 py-2 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Track your leave quotas and manage your time-off requests.
          </p>
        </div>

        <Link
          to="/apply-leave"
          className="inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-xs transition"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Apply for Leave
        </Link>
      </div>

      {/* Leave Balances Grid */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-4">Your Leave Balances</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <StatCard
            title="Casual Leave"
            value={`${balance?.casual?.remaining ?? 0} days`}
            subtext={`Total: ${balance?.casual?.total ?? 0} | Used: ${balance?.casual?.used ?? 0}`}
            icon={CalendarDays}
            color="blue"
          />
          <StatCard
            title="Sick Leave"
            value={`${balance?.sick?.remaining ?? 0} days`}
            subtext={`Total: ${balance?.sick?.total ?? 0} | Used: ${balance?.sick?.used ?? 0}`}
            icon={HeartPulse}
            color="emerald"
          />
          <StatCard
            title="Earned Leave"
            value={`${balance?.earned?.remaining ?? 0} days`}
            subtext={`Total: ${balance?.earned?.total ?? 0} | Used: ${balance?.earned?.used ?? 0}`}
            icon={Award}
            color="purple"
          />
        </div>
      </div>

      {/* Request Status Counts */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-4">Request Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Pending</p>
              <p className="text-xl font-bold text-gray-900">{counts.pending}</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Approved</p>
              <p className="text-xl font-bold text-gray-900">{counts.approved}</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-rose-50 text-rose-600">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Rejected</p>
              <p className="text-xl font-bold text-gray-900">{counts.rejected}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Requests Section */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Recent Leave Requests</h2>
          <Link
            to="/leave-history"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            View all history
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentLeaves.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p className="text-sm">No leave requests found.</p>
            <Link
              to="/apply-leave"
              className="mt-2 inline-block text-xs font-medium text-blue-600 hover:underline"
            >
              Submit your first request
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Leave Type</th>
                  <th className="px-6 py-3">Period</th>
                  <th className="px-6 py-3">Days</th>
                  <th className="px-6 py-3">Reason</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {recentLeaves.map((req) => (
                  <tr key={req._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium text-gray-900">{req.leaveType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                      {formatDate(req.startDate)} – {formatDate(req.endDate)}
                    </td>
                    <td className="px-6 py-4 font-semibold">{req.totalDays} day(s)</td>
                    <td className="px-6 py-4 max-w-xs truncate text-xs text-gray-500" title={req.reason}>
                      {req.reason}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={req.status} />
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

export default EmployeeDashboard;
