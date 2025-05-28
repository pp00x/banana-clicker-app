import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'player' | 'admin';
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, user, loading } = useAuth();
  
  // Show loading state
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
  
  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" />;
  }
  
  // Check role if required
  if (requiredRole && user.role !== requiredRole) {
    return user.role === 'admin' ? <Navigate to="/admin/users" /> : <Navigate to="/" />;
  }
  
  // Render children if authenticated and role check passes
  return <>{children}</>;
};

export default ProtectedRoute;