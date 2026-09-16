import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Compass, ArrowLeft, Calendar } from 'lucide-react';

const NotFound = () => {
  const { isAuthenticated, isAdmin } = useAuth();

  const homePath = !isAuthenticated ? '/login' : isAdmin ? '/admin/dashboard' : '/dashboard';

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
      {/* Subtle ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none" />

      <div className="p-4 bg-indigo-50 border border-indigo-100/80 text-indigo-600 rounded-3xl mb-6 shadow-glow-brand animate-fade-in">
        <Compass className="w-12 h-12" />
      </div>

      <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider mb-2">
        Error 404
      </span>

      <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
        Lost in the Calendar?
      </h1>

      <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-md leading-relaxed">
        The page you are looking for has either taken time off, moved to a new route, or requires administrative permissions.
      </p>

      <Link
        to={homePath}
        className="mt-6 inline-flex items-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-glow-brand transition active:scale-[0.98]"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Return to Portal
      </Link>
    </div>
  );
};

export default NotFound;
