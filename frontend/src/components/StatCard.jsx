import React from 'react';

const StatCard = ({
  title,
  value,
  subtext,
  icon: Icon,
  color = 'indigo',
  progress = null, // e.g. { used: 2, total: 12 }
}) => {
  const colorMap = {
    indigo: {
      border: 'border-indigo-100',
      iconBg: 'bg-indigo-50 text-indigo-600',
      bar: 'bg-indigo-600',
    },
    emerald: {
      border: 'border-emerald-100',
      iconBg: 'bg-emerald-50 text-emerald-600',
      bar: 'bg-emerald-600',
    },
    purple: {
      border: 'border-purple-100',
      iconBg: 'bg-purple-50 text-purple-600',
      bar: 'bg-purple-600',
    },
    amber: {
      border: 'border-amber-100',
      iconBg: 'bg-amber-50 text-amber-600',
      bar: 'bg-amber-600',
    },
    rose: {
      border: 'border-rose-100',
      iconBg: 'bg-rose-50 text-rose-600',
      bar: 'bg-rose-600',
    },
    blue: {
      border: 'border-blue-100',
      iconBg: 'bg-blue-50 text-blue-600',
      bar: 'bg-blue-600',
    },
  };

  const scheme = colorMap[color] || colorMap.indigo;
  const percentage = progress && progress.total > 0
    ? Math.min(100, Math.round((progress.used / progress.total) * 100))
    : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between group">
      <div>
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          {Icon && (
            <div className={`p-2.5 rounded-xl border border-slate-100 ${scheme.iconBg} transition-transform group-hover:scale-105`}>
              <Icon className="w-5 h-5" />
            </div>
          )}
        </div>

        <div className="mt-3">
          <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</p>
          {subtext && <p className="mt-1 text-xs text-slate-400">{subtext}</p>}
        </div>
      </div>

      {percentage !== null && (
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex justify-between text-[11px] font-medium text-slate-500 mb-1.5">
            <span>Used: {progress.used}d / {progress.total}d</span>
            <span className="font-semibold text-slate-700">{percentage}%</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${scheme.bar}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default StatCard;
