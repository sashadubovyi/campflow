import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '../store/auth.store';

let socket: Socket | null = null;

export function getNotificationsSocket(): Socket {
  if (socket) return socket;
  const token = useAuthStore.getState().accessToken;

  socket = io('/notifications', {
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
