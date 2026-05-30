import { api } from './client';

export interface BlockedUser {
  id: string;
  blockedAt: string;
  reason: string | null;
  user: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl: string | null;
  };
}

export const blocksApi = {
  async list(): Promise<BlockedUser[]> {
    const { data } = await api.get<BlockedUser[]>('/blocks');
    return data;
  },
  async block(userId: string, reason?: string) {
    const { data } = await api.post('/blocks', { userId, reason });
    return data;
  },
  async unblock(userId: string) {
    const { data } = await api.delete<{ unblocked: boolean }>(`/blocks/${userId}`);
    return data;
  },
};
