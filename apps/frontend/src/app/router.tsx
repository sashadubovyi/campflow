import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { RoomsPage } from '../pages/RoomsPage';
import { ProtectedRoute } from './ProtectedRoute';
import { RoomPage } from '../pages/rooms/RoomPage';
import { JoinByLinkPage } from '../pages/JoinByLinkPage';
import { ProfilePage } from '../pages/ProfilePage';
import { ProfileSettingsPage } from '../pages/ProfileSettingsPage';
import { ContactsPage } from '../pages/ContactsPage';

export const router: ReturnType<typeof createBrowserRouter> = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/join/:code', element: <JoinByLinkPage /> },
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
  {
    path: '/u/:username',
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings/profile',
    element: (
      <ProtectedRoute>
        <ProfileSettingsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/contacts',
    element: (
      <ProtectedRoute>
        <ContactsPage />
      </ProtectedRoute>
    ),
  },
  { path: '/', element: <Navigate to="/rooms" replace /> },
  { path: '*', element: <Navigate to="/rooms" replace /> },
]);
