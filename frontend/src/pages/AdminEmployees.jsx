import React, { useEffect, useState } from 'react';
import * as adminService from '../services/adminService';
import { Users, Search, AlertCircle, Calendar } from 'lucide-react';
import { formatDate } from '../utils/formatters';

const AdminEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await adminService.getAllEmployees();
        setEmployees(res.data || []);
      } catch (err) {
        setError(err.message || 'Failed to fetch employees list.');
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  const filtered = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase())
  );

  const renderBalanceBar = (category, colorClass, barClass) => {
    const remaining = category?.remaining ?? 0;
    const total = category?.total ?? 0;
    const used = category?.used ?? 0;
    const percentage = total > 0 ? Math.round((used / total) * 100) : 0;

    return (
      <div className="w-36 space-y-1">
        <div className="flex justify-between text-[11px] font-bold">
          <span className={colorClass}>{remaining}d left</span>
          <span className="text-slate-400 font-normal">{used}/{total}d</span>
        </div>
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${barClass}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-600" />
            Staff Quota Directory
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Monitor real-time leave consumption across all registered organization staff members.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee or email..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition"
          />
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <p className="text-xs font-semibold text-rose-700">{error}</p>
        </div>
      )}

      {/* Employees Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-card overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-56 gap-3">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold text-slate-400">Loading directory...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <p className="text-sm font-bold text-slate-700">No employees match your search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200/70">
                <tr>
                  <th className="px-6 py-3.5">Employee</th>
                  <th className="px-6 py-3.5">Casual Leave Quota</th>
                  <th className="px-6 py-3.5">Sick Leave Quota</th>
                  <th className="px-6 py-3.5">Earned Leave Quota</th>
                  <th className="px-6 py-3.5">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((emp) => {
                  const initials = emp.name
                    ? emp.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()
                    : 'E';

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center text-xs font-bold shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{emp.name}</div>
                            <div className="text-xs text-slate-400 font-mono">{emp.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderBalanceBar(emp.leaveBalance?.casual, 'text-indigo-600', 'bg-indigo-600')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderBalanceBar(emp.leaveBalance?.sick, 'text-emerald-600', 'bg-emerald-600')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderBalanceBar(emp.leaveBalance?.earned, 'text-purple-600', 'bg-purple-600')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400 font-medium">
                        {formatDate(emp.createdAt)}
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

export default AdminEmployees;
