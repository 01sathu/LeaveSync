import React, { useEffect, useState } from 'react';
import * as adminService from '../services/adminService';
import { Users, Search, AlertCircle } from 'lucide-react';
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Employees & Leave Quotas
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            View all organization employees and their active leave balances across leave types.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee or email..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <p className="text-sm text-rose-700 font-medium">{error}</p>
        </div>
      )}

      {/* Employees Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <p className="text-sm font-medium text-gray-700">No employees match your query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3.5">Employee</th>
                  <th className="px-6 py-3.5">Casual Leave (Total / Used / Rem)</th>
                  <th className="px-6 py-3.5">Sick Leave (Total / Used / Rem)</th>
                  <th className="px-6 py-3.5">Earned Leave (Total / Used / Rem)</th>
                  <th className="px-6 py-3.5">Member Since</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filtered.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50/70 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{emp.name}</div>
                      <div className="text-xs text-gray-400">{emp.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold text-blue-700">
                        {emp.leaveBalance?.casual?.remaining} days left
                      </span>
                      <span className="text-xs text-gray-400 block">
                        ({emp.leaveBalance?.casual?.total} total, {emp.leaveBalance?.casual?.used} used)
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold text-emerald-700">
                        {emp.leaveBalance?.sick?.remaining} days left
                      </span>
                      <span className="text-xs text-gray-400 block">
                        ({emp.leaveBalance?.sick?.total} total, {emp.leaveBalance?.sick?.used} used)
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold text-purple-700">
                        {emp.leaveBalance?.earned?.remaining} days left
                      </span>
                      <span className="text-xs text-gray-400 block">
                        ({emp.leaveBalance?.earned?.total} total, {emp.leaveBalance?.earned?.used} used)
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">
                      {formatDate(emp.createdAt)}
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

export default AdminEmployees;
