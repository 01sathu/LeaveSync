import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Compass, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  const { isAuthenticated, isAdmin } = useAuth();

  const homePath = !isAuthenticated ? '/login' : isAdmin ? '/admin/dashboard' : '/dashboard';

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="p-4 bg-gray-100 text-gray-600 rounded-full mb-4">
        <Compass className="w-10 h-10" />
      </div>
      <h1 className="text-3xl font-extrabold text-gray-900">404 - Page Not Found</h1>
      <p className="mt-2 text-sm text-gray-500 max-w-sm">
        The page you are looking for doesn't exist or you do not have permission to view it.
      </p>
      <Link
        to={homePath}
        className="mt-6 inline-flex items-center px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Return to Home
      </Link>
    </div>
  );
};

export default NotFound;
