import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 4000 }) => {
  useEffect(() => {
    if (!duration || !onClose) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!message) return null;

  const typeConfig = {
    success: {
      bg: 'bg-emerald-50/95 border-emerald-200 text-emerald-900',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />,
    },
    error: {
      bg: 'bg-rose-50/95 border-rose-200 text-rose-900',
      icon: <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />,
    },
    info: {
      bg: 'bg-indigo-50/95 border-indigo-200 text-indigo-900',
      icon: <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />,
    },
  };

  const current = typeConfig[type] || typeConfig.info;

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-slide-up max-w-md w-full px-4 sm:px-0">
      <div className={`p-4 rounded-xl border shadow-lg backdrop-blur-md flex items-start justify-between gap-3 ${current.bg}`}>
        <div className="flex items-start gap-3">
          {current.icon}
          <div className="text-sm font-medium leading-snug">{message}</div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700 transition p-0.5 rounded-lg shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
