import { ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { RootState } from '../store';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'customer' | 'admin' | 'delivery';
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, user, loading } = useSelector((state: RootState) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Show loading spinner while user data is being fetched (only if we're actually loading)
  if (isAuthenticated && !user && loading) {
    return <LoadingSpinner />;
  }

  // If user data is still not loaded after authentication and not loading, redirect to login
  if (isAuthenticated && !user && !loading) {
    return <Navigate to="/login" replace />;
  }

  // If we have user data, check role permissions
  if (user && requiredRole && user.role !== requiredRole) {
    // Redirect to appropriate dashboard based on user role
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (user.role === 'delivery') {
      return <Navigate to="/delivery" replace />;
    } else {
      return <Navigate to="/customer" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
