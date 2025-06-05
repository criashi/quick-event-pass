
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Loader2, ShieldX } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-continental-gray4 via-continental-white to-continental-silver flex items-center justify-center font-continental">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-continental-yellow mx-auto mb-4" />
          <p className="text-lg text-continental-gray1 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requireAdmin && profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-continental-gray4 via-continental-white to-continental-silver flex items-center justify-center font-continental">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="p-4 bg-continental-light-red/10 rounded-full w-fit mx-auto mb-6">
            <ShieldX className="h-12 w-12 text-continental-light-red" />
          </div>
          <h1 className="text-3xl font-bold text-continental-black mb-4">Access Denied</h1>
          <p className="text-continental-gray1 text-lg">You don't have permission to access this page.</p>
          <div className="w-20 h-1 bg-continental-yellow mx-auto mt-4"></div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
