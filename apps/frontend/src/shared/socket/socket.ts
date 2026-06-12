import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '../store/auth.store';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket) return socket;

  const baseUrl = import.meta.env.VITE_API_URL || '';
  const cleanUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

  // Передаем полный URL бэкенда + нужный неймспейс (/ws)
  socket = io(`${cleanUrl}/ws`, {
    path: '/socket.io',
    auth: (cb) => cb({ token: useAuthStore.getState().accessToken }),
    transports: ['websocket'],
    autoConnect: true,
  });

  socket.on('connect', () => console.log('[WS] connected', socket?.id));
  socket.on('disconnect', (reason) => console.warn('[WS] disconnected', reason));
  socket.on('connect_error', (err) => console.error('[WS] connect_error', err.message));
  socket.on('exception', (data) => console.error('[WS] server exception', data));

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

