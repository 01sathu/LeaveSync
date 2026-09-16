import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as employeeService from '../services/employeeService';
import * as leaveService from '../services/leaveService';
import { calculateLeaveDays } from '../utils/formatters';
import {
  Calendar,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Send,
  Info,
} from 'lucide-react';

const ApplyLeave = () => {
  const [balances, setBalances] = useState(null);
  const [leaveType, setLeaveType] = useState('Casual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const [loadingBalance, setLoadingBalance] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res = await employeeService.getLeaveBalance();
        setBalances(res.data);
      } catch (err) {
        setError('Failed to fetch available leave balances.');
      } finally {
        setLoadingBalance(false);
      }
    };
    fetchBalance();
  }, []);

  const totalDays = calculateLeaveDays(startDate, endDate);
  const typeKey = leaveType.toLowerCase();
  const availableDays = balances && balances[typeKey] ? balances[typeKey].remaining : 0;
  const isOverBalance = totalDays > 0 && totalDays > availableDays;
  const isEndDateBeforeStart = startDate && endDate && new Date(endDate) < new Date(startDate);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!startDate || !endDate) {
      setError('Please select both start and end dates.');
      return;
    }

    if (isEndDateBeforeStart) {
      setError('End date cannot be before start date.');
      return;
    }

    if (totalDays <= 0) {
      setError('Leave duration must be at least 1 day.');
      return;
    }

    if (isOverBalance) {
      setError(`Requested duration (${totalDays} days) exceeds available ${leaveType} balance (${availableDays} days).`);
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason for the leave request.');
      return;
    }

    setIsSubmitting(true);
    try {
      await leaveService.applyLeave({
        leaveType,
        startDate,
        endDate,
        reason: reason.trim(),
      });

      setSuccessMessage('Your leave request has been submitted successfully with status: Pending.');
      // Refresh balances
      const res = await employeeService.getLeaveBalance();
      setBalances(res.data);

      // Clear form inputs
      setStartDate('');
      setEndDate('');
      setReason('');
    } catch (err) {
      setError(err.message || 'Failed to submit leave request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back button */}
      <Link
        to="/dashboard"
        className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" />
        Back to Dashboard
      </Link>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50/50">
          <h1 className="text-xl font-bold text-gray-900">Apply for Leave</h1>
          <p className="mt-1 text-xs text-gray-500">
            Submit a new time-off request for administrative review.
          </p>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Success Banner */}
          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800">{successMessage}</p>
                  <p className="text-xs text-emerald-600 mt-1">
                    Your balance is not deducted while the request is pending review.
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/leave-history')}
                className="text-xs font-semibold text-emerald-800 hover:underline shrink-0"
              >
                View in History →
              </button>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <p className="text-sm text-rose-700 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Leave Type Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Leave Type</label>
              <div className="grid grid-cols-3 gap-3">
                {['Casual', 'Sick', 'Earned'].map((type) => {
                  const key = type.toLowerCase();
                  const remaining = balances && balances[key] ? balances[key].remaining : '—';
                  const isSelected = leaveType === type;

                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setLeaveType(type)}
                      className={`p-3 text-left border rounded-xl transition ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <p className={`text-sm font-semibold ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                        {type}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {loadingBalance ? '...' : `${remaining} days available`}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date Range Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>
              </div>
            </div>

            {/* Live Calculation & Balance Summary Widget */}
            {startDate && endDate && (
              <div
                className={`p-4 rounded-xl border text-sm flex items-center justify-between ${
                  isEndDateBeforeStart
                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                    : isOverBalance
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-blue-50/70 border-blue-200 text-blue-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Info className="w-4 h-4 shrink-0" />
                  <div>
                    {isEndDateBeforeStart ? (
                      <span className="font-semibold">End date cannot be earlier than start date.</span>
                    ) : (
                      <span>
                        Calculated Duration:{' '}
                        <strong className="font-bold">{totalDays} calendar day(s)</strong> (inclusive).
                      </span>
                    )}
                  </div>
                </div>

                {!isEndDateBeforeStart && (
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      isOverBalance ? 'bg-amber-200 text-amber-900' : 'bg-blue-200 text-blue-900'
                    }`}
                  >
                    {isOverBalance ? 'Exceeds Balance' : `${availableDays} days remaining`}
                  </span>
                )}
              </div>
            )}

            {/* Reason */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-medium text-gray-700">Reason</label>
                <span className="text-xs text-gray-400">{reason.length}/500</span>
              </div>
              <textarea
                rows={4}
                required
                maxLength={500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain the reason for your leave request..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isOverBalance || isEndDateBeforeStart}
                className="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-xs transition"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Leave Request'}
                <Send className="w-4 h-4 ml-2" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ApplyLeave;
