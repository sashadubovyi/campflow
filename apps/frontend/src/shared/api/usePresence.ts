import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '../socket/socket';
import type { RoomDetails } from './rooms.api';

/**
 * Підписується на WS-події presence:online / presence:offline і оновлює
 * стан учасників у кеші React Query для відкритої кімнати.
 */
export function usePresence(roomId: string) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!roomId) return;
    const socket = getSocket();

    function onOnline({ userId }: { userId: string }) {
      qc.setQueryData<RoomDetails>(['room', roomId], (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          members: prev.members.map((m) =>
            m.user.id === userId ? { ...m, user: { ...m.user, isOnline: true } } : m,
          ),
        };
      });
    }

    function onOffline({ userId, lastSeenAt }: { userId: string; lastSeenAt: string }) {
      qc.setQueryData<RoomDetails>(['room', roomId], (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          members: prev.members.map((m) =>
            m.user.id === userId ? { ...m, user: { ...m.user, isOnline: false, lastSeenAt } } : m,
          ),
        };
      });
    }

    socket.on('presence:online', onOnline);
    socket.on('presence:offline', onOffline);

    return () => {
      socket.off('presence:online', onOnline);
      socket.off('presence:offline', onOffline);
    };
  }, [roomId, qc]);
}
