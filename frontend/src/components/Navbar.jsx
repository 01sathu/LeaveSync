import React from 'react';
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
  User as UserIcon,
} from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, isEmployee, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) return null;

  const navLinkClass = ({ isActive }) =>
    `inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition ${
      isActive
        ? 'bg-blue-50 text-blue-700 font-semibold'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
    }`;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center">
            <Link to={isAdmin ? '/admin/dashboard' : '/dashboard'} className="flex items-center gap-2">
              <div className="bg-blue-600 text-white p-2 rounded-lg shadow-xs">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg text-gray-900 tracking-tight">
                Leave<span className="text-blue-600">Sync</span>
              </span>
            </Link>

            {/* Navigation links */}
            <nav className="hidden md:ml-8 md:flex md:space-x-2">
              {isEmployee && (
                <>
                  <NavLink to="/dashboard" className={navLinkClass}>
                    <LayoutDashboard className="w-4 h-4 mr-1.5" />
                    Dashboard
                  </NavLink>
                  <NavLink to="/apply-leave" className={navLinkClass}>
                    <PlusCircle className="w-4 h-4 mr-1.5" />
                    Apply Leave
                  </NavLink>
                  <NavLink to="/leave-history" className={navLinkClass}>
                    <History className="w-4 h-4 mr-1.5" />
                    Leave History
                  </NavLink>
                </>
              )}

              {isAdmin && (
                <>
                  <NavLink to="/admin/dashboard" className={navLinkClass}>
                    <LayoutDashboard className="w-4 h-4 mr-1.5" />
                    Dashboard
                  </NavLink>
                  <NavLink to="/admin/leaves" className={navLinkClass}>
                    <FileCheck2 className="w-4 h-4 mr-1.5" />
                    Leave Requests
                  </NavLink>
                  <NavLink to="/admin/employees" className={navLinkClass}>
                    <Users className="w-4 h-4 mr-1.5" />
                    Employees
                  </NavLink>
                </>
              )}
            </nav>
          </div>

          {/* User profile & Logout */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full text-xs text-gray-700">
              <UserIcon className="w-3.5 h-3.5 text-gray-400" />
              <span className="font-medium">{user?.name}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                  isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                }`}
              >
                {user?.role}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              title="Logout"
            >
              <LogOut className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
