import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { RoomsPage } from '../pages/RoomsPage';
import { ProtectedRoute } from './ProtectedRoute';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    path: '/rooms',
    element: (
      <ProtectedRoute>
        <RoomsPage />
      </ProtectedRoute>
    ),
  },
  { path: '/', element: <Navigate to="/rooms" replace /> },
  { path: '*', element: <Navigate to="/rooms" replace /> },
]);
