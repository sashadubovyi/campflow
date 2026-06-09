import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '../store/auth.store';

let socket: Socket | null = null;

export function getNotificationsSocket(): Socket {
  if (socket) return socket;

  const token = useAuthStore.getState().accessToken;
  const baseUrl = import.meta.env.VITE_API_URL || '';
  const cleanUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

  // Передаем полный URL бэкенда + неймспейс (/notifications)
  socket = io(`${cleanUrl}/notifications`, {
    path: '/socket.io',
    auth: { token },
    transports: ['websocket'],
    autoConnect: true,
  });

  return socket;
}

export function disconnectNotificationsSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
