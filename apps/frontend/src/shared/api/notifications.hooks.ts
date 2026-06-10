import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi, type NotificationItem } from './notifications.api';
import { getNotificationsSocket } from '../socket/notifications-socket';
import { useAuthStore } from '../store/auth.store';

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list(),
    refetchOnWindowFocus: true,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsApi.unreadCount(),
    refetchOnWindowFocus: true,
  });
}

/**
 * Підписка на real-time WS-події. Викликається один раз у App.tsx
 * після авторизації.
 */
export function useNotificationsSubscription() {
  const qc = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    const socket = getNotificationsSocket();

    if (accessToken) {
      // auth callback will supply the fresh token on connect/reconnect
      if (!socket.connected) socket.connect();
    } else {
      socket.disconnect();
      return;
    }

    function onNew(notification: NotificationItem) {
      qc.setQueryData<number>(['notifications', 'unread-count'], (prev = 0) => prev + 1);
      qc.setQueryData<NotificationItem[]>(['notifications'], (prev = []) => [
        notification,
        ...prev,
      ]);
      qc.invalidateQueries({ queryKey: ['invites'] });
    }

    socket.on('notification:new', onNew);

    return () => {
      socket.off('notification:new', onNew);
    };
  }, [qc, accessToken]);
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
