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
  Calendar,
  Sparkles,
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
      <div className="w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-6 text-center max-w-md mx-auto">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-rose-800">{error}</p>
          <button
            onClick={loadDashboardData}
            className="mt-4 px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-xl hover:bg-rose-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-card">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-indigo-200 text-xs font-medium backdrop-blur-xs mb-1">
              <Sparkles className="w-3 h-3 text-indigo-300" />
              Employee Workspace
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hello, {user?.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Track your available leave balance, submit new time-off requests, and monitor approval statuses in real-time.
            </p>
          </div>

          <Link
            to="/apply-leave"
            className="inline-flex items-center justify-center px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-glow-brand transition active:scale-[0.98] shrink-0"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Apply For Leave
          </Link>
        </div>
      </div>

      {/* Leave Quota Visualizer Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
            Current Leave Quotas
          </h2>
          <span className="text-xs text-slate-400">Values update instantly upon admin approval</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <StatCard
            title="Casual Leave"
            value={`${balance?.casual?.remaining ?? 0} days left`}
            subtext="Available for urgent personal matters"
            icon={CalendarDays}
            color="indigo"
            progress={{
              used: balance?.casual?.used ?? 0,
              total: balance?.casual?.total ?? 12,
            }}
          />
          <StatCard
            title="Sick Leave"
            value={`${balance?.sick?.remaining ?? 0} days left`}
            subtext="Available for medical appointments and recovery"
            icon={HeartPulse}
            color="emerald"
            progress={{
              used: balance?.sick?.used ?? 0,
              total: balance?.sick?.total ?? 10,
            }}
          />
          <StatCard
            title="Earned Leave"
            value={`${balance?.earned?.remaining ?? 0} days left`}
            subtext="Available for planned vacations & family time"
            icon={Award}
            color="purple"
            progress={{
              used: balance?.earned?.used ?? 0,
              total: balance?.earned?.total ?? 15,
            }}
          />
        </div>
      </div>

      {/* Overview Counts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Pending Requests</p>
              <p className="text-2xl font-extrabold text-slate-900">{counts.pending}</p>
            </div>
          </div>
          <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
            Under Review
          </span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Approved Requests</p>
              <p className="text-2xl font-extrabold text-slate-900">{counts.approved}</p>
            </div>
          </div>
          <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
            Balance Deducted
          </span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/20">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Rejected Requests</p>
              <p className="text-2xl font-extrabold text-slate-900">{counts.rejected}</p>
            </div>
          </div>
          <span className="text-[11px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
            Balance Intact
          </span>
        </div>
      </div>

      {/* Recent Requests Section */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-card">
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-bold text-slate-800">Recent Leave Submissions</h2>
          </div>
          <Link
            to="/leave-history"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition"
          >
            Full History
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentLeaves.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <CalendarDays className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No leave requests yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Apply for leave whenever you need time away from work.
            </p>
            <Link
              to="/apply-leave"
              className="mt-3 inline-flex items-center text-xs font-bold text-indigo-600 hover:underline"
            >
              Submit your first request →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200/70">
                <tr>
                  <th className="px-6 py-3.5">Type</th>
                  <th className="px-6 py-3.5">Period</th>
                  <th className="px-6 py-3.5">Duration</th>
                  <th className="px-6 py-3.5">Reason</th>
                  <th className="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recentLeaves.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{req.leaveType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600 font-medium">
                      {formatDate(req.startDate)} – {formatDate(req.endDate)}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {req.totalDays} day(s)
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate text-xs text-slate-500" title={req.reason}>
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
