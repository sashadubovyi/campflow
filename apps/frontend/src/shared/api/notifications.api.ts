import { api } from './client';

export type NotificationKind =
  | 'room_invite'
  | 'room_invite_accepted'
  | 'room_invite_declined'
  | 'join_request'
  | 'join_request_accepted'
  | 'join_request_rejected'
  | 'member_removed'
  | 'room_admin_transferred'
  | 'room_deletion_warning'
  | 'system';

export interface NotificationItem {
  id: string;
  userId: string;
  kind: NotificationKind;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

export const notificationsApi = {
  async list(): Promise<NotificationItem[]> {
    const { data } = await api.get<NotificationItem[]>('/notifications');
    return data;
  },
  async unreadCount(): Promise<number> {
    const { data } = await api.get<{ count: number }>('/notifications/unread-count');
    return data.count;
  },
  async markRead(id: string) {
    return api.post(`/notifications/${id}/read`);
  },
  async markAllRead() {
    return api.post('/notifications/read-all');
  },
};
