import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  userType: 'patient' | 'doctor' | 'pharma';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, userType }) => {
  const { user, isAuthenticated, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('User not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Check if the user's type matches the required type for this route
  if (user?.userType !== userType) {
    console.log('User type mismatch:', { expected: userType, actual: user?.userType });
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;