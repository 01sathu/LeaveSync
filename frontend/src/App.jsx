import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import EmployeeDashboard from './pages/EmployeeDashboard';
import ApplyLeave from './pages/ApplyLeave';
import LeaveHistory from './pages/LeaveHistory';
import AdminDashboard from './pages/AdminDashboard';
import AdminEmployees from './pages/AdminEmployees';
import AdminLeaves from './pages/AdminLeaves';
import AdminLeaveDetail from './pages/AdminLeaveDetail';
import NotFound from './pages/NotFound';

function App() {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      <Navbar />

      <main className="flex-1">
        <Routes>
          {/* Default Root Redirect */}
          <Route
            path="/"
            element={
              !isAuthenticated ? (
                <Navigate to="/login" replace />
              ) : isAdmin ? (
                <Navigate to="/admin/dashboard" replace />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          {/* Public Routes */}
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to={isAdmin ? '/admin/dashboard' : '/dashboard'} replace />
              ) : (
                <Login />
              )
            }
          />

          {/* Employee Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['employee']} />}>
            <Route path="/dashboard" element={<EmployeeDashboard />} />
            <Route path="/apply-leave" element={<ApplyLeave />} />
            <Route path="/leave-history" element={<LeaveHistory />} />
          </Route>

          {/* Admin Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/employees" element={<AdminEmployees />} />
            <Route path="/admin/leaves" element={<AdminLeaves />} />
            <Route path="/admin/leaves/:id" element={<AdminLeaveDetail />} />
          </Route>

          {/* 404 Catch-All */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
