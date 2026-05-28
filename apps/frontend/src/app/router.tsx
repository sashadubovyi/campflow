import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { RoomsPage } from '../pages/RoomsPage';
import { ProtectedRoute } from './ProtectedRoute';
import { RoomPage } from '../pages/rooms/RoomPage';

export const router: ReturnType<typeof createBrowserRouter> = createBrowserRouter([
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
  {
    path: '/rooms/:id',
    element: (
      <ProtectedRoute>
        <RoomPage />
      </ProtectedRoute>
    ),
  },
  { path: '/', element: <Navigate to="/rooms" replace /> },
  { path: '*', element: <Navigate to="/rooms" replace /> },
]);
