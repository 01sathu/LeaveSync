import React from 'react';

const StatusBadge = ({ status, size = 'md' }) => {
  const normalized = status ? status.toLowerCase() : 'pending';

  const config = {
    pending: {
      bg: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
      dot: 'bg-amber-500 animate-pulse',
      label: 'Pending',
    },
    approved: {
      bg: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
      dot: 'bg-emerald-500',
      label: 'Approved',
    },
    rejected: {
      bg: 'bg-rose-500/10 text-rose-700 border-rose-500/20',
      dot: 'bg-rose-500',
      label: 'Rejected',
    },
  };

  const current = config[normalized] || config.pending;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border shadow-2xs tracking-wide ${sizeClasses} ${current.bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${current.dot}`} />
      {current.label}
    </span>
  );
};

export default StatusBadge;
