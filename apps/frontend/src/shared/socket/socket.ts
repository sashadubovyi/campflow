import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '../store/auth.store';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket) return socket;

  const baseUrl = import.meta.env.VITE_API_URL || '';
  const cleanUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

  socket = io(`${cleanUrl}/ws`, {
    path: '/socket.io',
    // auth callback is called fresh on every (re)connect attempt
    auth: (cb) => cb({ token: useAuthStore.getState().accessToken }),
    transports: ['websocket'],
    autoConnect: false, // connect manually once we have a token
  });

  socket.on('connect', () => console.log('[WS] connected', socket?.id));
  socket.on('disconnect', (reason) => console.warn('[WS] disconnected', reason));
  socket.on('connect_error', (err) => console.error('[WS] connect_error', err.message));
  socket.on('exception', (data) => console.error('[WS] server exception', data));

  // React to auth token changes: connect when token arrives, disconnect on logout
  useAuthStore.subscribe((state, prev) => {
    if (!socket) return;
    if (state.accessToken && !prev.accessToken && !socket.connected) {
      socket.connect();
    } else if (!state.accessToken && prev.accessToken && socket.connected) {
      socket.disconnect();
    }
  });

  // If the token is already available (e.g. page refresh with valid session),
  // connect immediately instead of waiting for the next store update.
  if (useAuthStore.getState().accessToken) {
    socket.connect();
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}


