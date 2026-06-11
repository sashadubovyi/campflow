import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../shared/store/useAuth';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isInitialized } = useAuth();

  // While bootstrap is still running, return nothing — AppPreloader overlay covers the screen.
  if (!isInitialized && !isAuthenticated) {
    return null;
  }

  // Bootstrap finished, no session — redirect to login.
  if (isInitialized && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated (either via persisted user or completed bootstrap).
  return <>{children}</>;
}
