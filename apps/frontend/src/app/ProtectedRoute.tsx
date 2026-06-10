import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../shared/store/useAuth';
import { BrandLoader } from '../shared/ui/BrandLoader';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isInitialized } = useAuth();

  // Поки bootstrap ще не завершився і немає збереженого юзера (localStorage пустий)
  // — показуємо сплеш-екран, щоб не флікати на /login передчасно.
  if (!isInitialized && !isAuthenticated) {
    return <BrandLoader fullscreen />;
  }

  // Bootstrap завершився і юзер не авторизований — редиректимо.
  if (isInitialized && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Юзер є в localStorage (optimistic) або вже пройшов bootstrap успішно.
  return <>{children}</>;
}
