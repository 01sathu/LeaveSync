import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  LayoutDashboard,
  PlusCircle,
  History,
  Users,
  FileCheck2,
  LogOut,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, isEmployee, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) return null;

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  const navLinkClass = ({ isActive }) =>
    `inline-flex items-center px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all duration-150 ${
      isActive
        ? 'bg-slate-900 text-white shadow-xs'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
    }`;

  const mobileNavLinkClass = ({ isActive }) =>
    `flex items-center px-4 py-2.5 text-sm font-medium rounded-xl transition ${
      isActive
        ? 'bg-slate-900 text-white'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  return (
    <header className="glass-nav sticky top-0 z-40">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center">
            <Link to={isAdmin ? '/admin/dashboard' : '/dashboard'} className="flex items-center gap-2.5 group">
              <div className="bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white p-2 rounded-xl shadow-glow-brand transition-transform group-hover:scale-105">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base text-slate-900 tracking-tight">
                    Leave<span className="text-indigo-600">Sync</span>
                  </span>
                </div>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:ml-8 md:flex md:space-x-1.5">
              {isEmployee && (
                <>
                  <NavLink to="/dashboard" className={navLinkClass}>
                    <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" />
                    Dashboard
                  </NavLink>
                  <NavLink to="/apply-leave" className={navLinkClass}>
                    <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                    Apply Leave
                  </NavLink>
                  <NavLink to="/leave-history" className={navLinkClass}>
                    <History className="w-3.5 h-3.5 mr-1.5" />
                    Leave History
                  </NavLink>
                </>
              )}

              {isAdmin && (
                <>
                  <NavLink to="/admin/dashboard" className={navLinkClass}>
                    <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" />
                    Dashboard
                  </NavLink>
                  <NavLink to="/admin/leaves" className={navLinkClass}>
                    <FileCheck2 className="w-3.5 h-3.5 mr-1.5" />
                    Leave Requests
                  </NavLink>
                  <NavLink to="/admin/employees" className={navLinkClass}>
                    <Users className="w-3.5 h-3.5 mr-1.5" />
                    Employees
                  </NavLink>
                </>
              )}
            </nav>
          </div>

          {/* Right Section: User Profile & Actions */}
          <div className="hidden sm:flex items-center space-x-3">
            {/* User Profile Pill */}
            <div className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full border border-slate-200/80 bg-slate-50/70 shadow-2xs">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shadow-2xs">
                {initials}
              </div>
              <span className="text-xs font-semibold text-slate-800">{user?.name}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isAdmin
                    ? 'bg-purple-100 text-purple-700 border border-purple-200/60'
                    : 'bg-indigo-100 text-indigo-700 border border-indigo-200/60'
                }`}
              >
                {user?.role}
              </span>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50/80 rounded-xl transition"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              Sign out
            </button>
          </div>

          {/* Mobile Menu Trigger */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Collapsible Navigation */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-200/80 bg-white/95 backdrop-blur-md px-4 pt-3 pb-5 space-y-2 animate-slide-up">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                {initials}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">{user?.name}</p>
                <p className="text-[11px] text-slate-500">{user?.email}</p>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'
              }`}
            >
              {user?.role}
            </span>
          </div>

          {isEmployee && (
            <>
              <NavLink
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Dashboard
              </NavLink>
              <NavLink
                to="/apply-leave"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Apply Leave
              </NavLink>
              <NavLink
                to="/leave-history"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                <History className="w-4 h-4 mr-2" />
                Leave History
              </NavLink>
            </>
          )}

          {isAdmin && (
            <>
              <NavLink
                to="/admin/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Dashboard
              </NavLink>
              <NavLink
                to="/admin/leaves"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                <FileCheck2 className="w-4 h-4 mr-2" />
                Leave Requests
              </NavLink>
              <NavLink
                to="/admin/employees"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                <Users className="w-4 h-4 mr-2" />
                Employees
              </NavLink>
            </>
          )}

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="w-full flex items-center px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
