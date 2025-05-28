import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './hooks/useAuth';

// Layouts
import AppLayout from './layouts/AppLayout';
import AdminLayout from './layouts/AdminLayout';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PlayerHomePage from './pages/PlayerHomePage';
import PlayerRankPage from './pages/PlayerRankPage';
import AdminUserManagementPage from './pages/AdminUserManagementPage';
import AdminActivityMonitorPage from './pages/AdminActivityMonitorPage';
import NotFoundPage from './pages/NotFoundPage';

// Components
import ProtectedRoute from './components/common/ProtectedRoute';
import PageTransition from './components/common/PageTransition';

function App() {
  const location = useLocation();
  const { isAuthenticated, user, loading } = useAuth();

  useEffect(() => {
    document.title = 'Banana Clicker - The Ultimate Clicking Game';
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-300 to-yellow-500 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="text-4xl font-bold text-yellow-900">Loading...</div>
          <div className="mt-4 relative w-24 h-24">
            <div className="absolute inset-0 rounded-full bg-yellow-400 animate-ping opacity-75"></div>
            <div className="relative rounded-full bg-yellow-500 w-24 h-24"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/" /> : 
          <PageTransition>
            <LoginPage />
          </PageTransition>
        } />
        <Route path="/register" element={
          isAuthenticated ? <Navigate to="/" /> : 
          <PageTransition>
            <RegisterPage />
          </PageTransition>
        } />

        {/* Player Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }>
          <Route index element={<PageTransition><PlayerHomePage /></PageTransition>} />
          <Route path="ranks" element={<PageTransition><PlayerRankPage /></PageTransition>} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route path="users" element={<PageTransition><AdminUserManagementPage /></PageTransition>} />
          <Route path="activity" element={<PageTransition><AdminActivityMonitorPage /></PageTransition>} />
          <Route index element={<Navigate to="/admin/users\" replace />} />
        </Route>

        {/* Catch-all route */}
        <Route path="*" element={<PageTransition><NotFoundPage /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}

export default App;