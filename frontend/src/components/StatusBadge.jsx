import React from 'react';
import { Clock, CheckCircle2, XCircle } from 'lucide-react';

const StatusBadge = ({ status }) => {
  const normalized = status ? status.toLowerCase() : 'pending';

  const badgeStyles = {
    pending: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: <Clock className="w-3.5 h-3.5 mr-1 text-amber-500" />,
      label: 'Pending',
    },
    approved: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-500" />,
      label: 'Approved',
    },
    rejected: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: <XCircle className="w-3.5 h-3.5 mr-1 text-rose-500" />,
      label: 'Rejected',
    },
  };

  const current = badgeStyles[normalized] || badgeStyles.pending;

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${current.bg}`}>
      {current.icon}
      {current.label}
    </span>
  );
};

export default StatusBadge;
