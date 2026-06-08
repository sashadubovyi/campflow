import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { RoomsPage } from '../pages/RoomsPage';
import { ProtectedRoute } from './ProtectedRoute';
import { AppShell } from './AppShell';
import { RoomPage } from '../pages/rooms/RoomPage';
import { JoinByLinkPage } from '../pages/JoinByLinkPage';
import { ProfilePage } from '../pages/ProfilePage';
import { ProfileSettingsPage } from '../pages/ProfileSettingsPage';
import { ContactsPage } from '../pages/ContactsPage';
import { NotificationsPage } from '../pages/NotificationsPage';
import { BlockedUsersPage } from '../pages/BlockedUsersPage';
import { CalendarPage } from '../pages/CalendarPage';
import { ChatPage } from '../pages/ChatPage';
import { DirectChatPage } from '../pages/DirectChatPage';
import { MapPage } from '../pages/MapPage';
import { EventsPage } from '../pages/EventsPage';
import { SearchPage } from '../pages/SearchPage';

export const router: ReturnType<typeof createBrowserRouter> = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/join/:code', element: <JoinByLinkPage /> },
  {
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { path: '/rooms', element: <RoomsPage /> },
      { path: '/rooms/:id', element: <RoomPage /> },
      { path: '/u/:username', element: <ProfilePage /> },
      { path: '/settings/profile', element: <ProfileSettingsPage /> },
      { path: '/settings/blocked', element: <BlockedUsersPage /> },
      { path: '/contacts', element: <ContactsPage /> },
      { path: '/calendar', element: <CalendarPage /> },
      { path: '/notifications', element: <NotificationsPage /> },
      { path: '/chat', element: <ChatPage /> },
      { path: '/dm/:username', element: <DirectChatPage /> },
      { path: '/map', element: <MapPage /> },
      { path: '/events', element: <EventsPage /> },
      { path: '/search', element: <SearchPage /> },
    ],
  },
  { path: '/', element: <Navigate to="/rooms" replace /> },
  { path: '*', element: <Navigate to="/rooms" replace /> },
]);
