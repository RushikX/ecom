import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from './store';
import { getProfile } from './store/slices/authSlice';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import DeliveryDashboard from './pages/delivery/DeliveryDashboard';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, loading, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Only fetch profile on page refresh when we have a token but no user data
    // This handles the case where the page is refreshed and we need to restore user data
    // Don't fetch if we're already loading or if we already have user data
    if (isAuthenticated && !user && !loading) {
      dispatch(getProfile());
    }
  }, [dispatch, isAuthenticated, user, loading]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-dark-900">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Protected routes */}
          <Route
            path="/customer/*"
            element={
              <ProtectedRoute requiredRole="customer">
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/delivery/*"
            element={
              <ProtectedRoute requiredRole="delivery">
                <DeliveryDashboard />
              </ProtectedRoute>
            }
          />

          {/* Redirect based on user role */}
          <Route
            path="/dashboard"
            element={
              isAuthenticated ? (
                user?.role === 'admin' ? (
                  <Navigate to="/admin" replace />
                ) : user?.role === 'delivery' ? (
                  <Navigate to="/delivery" replace />
                ) : (
                  <Navigate to="/customer" replace />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;