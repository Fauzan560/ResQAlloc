import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { DisclaimerBanner } from './components/common/DisclaimerBanner';
import { PublicEmergencyPage } from './pages/PublicEmergencyPage';
import { ResponderDashboard } from './pages/ResponderDashboard';
import { HospitalDashboard } from './pages/HospitalDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { HospitalsDirectoryPage } from './pages/HospitalsDirectoryPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { LoadingSpinner } from './components/common/LoadingSpinner';

// Role-protected route wrapper
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <LoadingSpinner message="Authenticating session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // If admin, allow access to all routes
    if (user?.role === 'admin') {
      return children;
    }
    // Otherwise redirect to appropriate dashboard
    if (user?.role === 'responder') return <Navigate to="/responder" replace />;
    if (user?.role === 'hospital_staff') return <Navigate to="/hospital-staff" replace />;
    return <Navigate to="/emergency-sos" replace />;
  }

  return children;
};

// Root index redirect based on user role or public
const RootRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <LoadingSpinner message="Loading ResQAlloc dispatch environment..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/emergency-sos" replace />;
  }

  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  if (user?.role === 'hospital_staff') return <Navigate to="/hospital-staff" replace />;
  return <Navigate to="/responder" replace />;
};

export const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-red-500 selection:text-white">
          <DisclaimerBanner />
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Home redirect */}
              <Route path="/" element={<RootRedirect />} />

              {/* Public routes */}
              <Route path="/emergency-sos" element={<PublicEmergencyPage />} />
              <Route path="/hospitals" element={<HospitalsDirectoryPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Role-protected routes */}
              <Route
                path="/responder"
                element={
                  <ProtectedRoute allowedRoles={['responder', 'admin']}>
                    <ResponderDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/hospital-staff"
                element={
                  <ProtectedRoute allowedRoles={['hospital_staff', 'admin']}>
                    <HospitalDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/emergency-sos" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
