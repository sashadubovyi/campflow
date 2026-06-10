import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../shared/store/useAuth';
import { BrandLoader } from '../shared/ui/BrandLoader';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isInitialized } = useAuth();

  // Чекаємо завершення bootstrap (відновлення сесії через cookie).
  // App.tsx показує BrandLoader поки isInitialized=false, але ця перевірка
  // гарантує коректну поведінку якщо ProtectedRoute рендериться окремо.
  if (!isInitialized) {
    return <BrandLoader fullscreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
