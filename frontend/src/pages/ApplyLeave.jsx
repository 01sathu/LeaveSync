import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as employeeService from '../services/employeeService';
import * as leaveService from '../services/leaveService';
import { calculateLeaveDays } from '../utils/formatters';
import Toast from '../components/Toast';
import {
  Calendar,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Send,
  Info,
  CalendarDays,
  HeartPulse,
  Award,
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
  const [toastMessage, setToastMessage] = useState('');

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

    if (!startDate || !endDate) {
      setError('Please select both start and end dates.');
      return;
    }

    if (isEndDateBeforeStart) {
      setError('End date cannot be earlier than start date.');
      return;
    }

    if (totalDays <= 0) {
      setError('Leave duration must be at least 1 calendar day.');
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

      setToastMessage('Leave request submitted successfully with status: Pending');

      // Refresh balances
      const res = await employeeService.getLeaveBalance();
      setBalances(res.data);

      // Reset form
      setStartDate('');
      setEndDate('');
      setReason('');

      // Auto redirect to history after a brief delay
      setTimeout(() => {
        navigate('/leave-history');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to submit leave request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const typeIcons = {
    Casual: CalendarDays,
    Sick: HeartPulse,
    Earned: Award,
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      <Toast message={toastMessage} onClose={() => setToastMessage('')} />

      {/* Back button */}
      <Link
        to="/dashboard"
        className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
        Back to Dashboard
      </Link>

      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-card overflow-hidden">
        {/* Header */}
        <div className="px-6 sm:px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Submit Leave Application
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Apply for time-off with live duration calculation and balance verification.
            </p>
          </div>
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100/80">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Error Banner */}
          {error && (
            <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-4 flex items-start gap-3 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-rose-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Leave Type Cards */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                1. Select Leave Category
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {['Casual', 'Sick', 'Earned'].map((type) => {
                  const key = type.toLowerCase();
                  const remaining = balances && balances[key] ? balances[key].remaining : 0;
                  const isSelected = leaveType === type;
                  const Icon = typeIcons[type];

                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setLeaveType(type)}
                      className={`p-4 text-left border rounded-2xl transition-all duration-150 flex flex-col justify-between relative group ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-bold ${isSelected ? 'text-indigo-950' : 'text-slate-900'}`}>
                          {type}
                        </span>
                        <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-xs">
                        <span className={`font-bold ${isSelected ? 'text-indigo-600' : 'text-slate-700'}`}>
                          {loadingBalance ? '...' : `${remaining} days available`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date Range Inputs */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                2. Select Date Range
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">End Date (Inclusive)</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition"
                  />
                </div>
              </div>
            </div>

            {/* Live Calculation & Balance Feedback Bar */}
            {startDate && endDate && (
              <div
                className={`p-4 rounded-2xl border text-xs font-medium flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 animate-fade-in ${
                  isEndDateBeforeStart
                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                    : isOverBalance
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-indigo-50/60 border-indigo-200 text-indigo-950'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0" />
                  {isEndDateBeforeStart ? (
                    <span className="font-bold">End date cannot be earlier than start date.</span>
                  ) : (
                    <span>
                      Duration: <strong className="font-extrabold">{totalDays} calendar day(s)</strong> inclusive.
                    </span>
                  )}
                </div>

                {!isEndDateBeforeStart && (
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        isOverBalance ? 'bg-amber-200 text-amber-900' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isOverBalance ? 'Exceeds Balance' : `${availableDays} days in quota`}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Reason */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  3. Reason for Absence
                </label>
                <span className="text-[11px] font-mono text-slate-400">{reason.length}/500</span>
              </div>
              <textarea
                rows={4}
                required
                maxLength={500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="State the reason for your time-off request..."
                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition"
              />
            </div>

            {/* Submit & Cancel Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isOverBalance || isEndDateBeforeStart}
                className="inline-flex items-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-40 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-glow-brand transition"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
                <Send className="w-3.5 h-3.5 ml-2" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ApplyLeave;
