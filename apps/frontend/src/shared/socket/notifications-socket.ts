import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '../store/auth.store';

let socket: Socket | null = null;

export function getNotificationsSocket(): Socket {
  if (socket) return socket;

  const baseUrl = import.meta.env.VITE_API_URL || '';
  const cleanUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

  socket = io(`${cleanUrl}/notifications`, {
    path: '/socket.io',
    // auth callback is called fresh on every (re)connect attempt
    auth: (cb) => cb({ token: useAuthStore.getState().accessToken }),
    transports: ['websocket'],
    autoConnect: false, // connect manually once we have a token
  });

  return socket;
}

export function disconnectNotificationsSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
