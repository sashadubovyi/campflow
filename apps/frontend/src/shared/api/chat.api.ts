import { api } from './client';

export interface Message {
  id: string;
  roomId: string;
  authorId: string | null;
  type: 'text' | 'system';
  content: string;
  isImportant: boolean;
  createdAt: string;
  author: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  } | null;
  /** Local-only optimistic send status */
  _status?: 'sending' | 'failed';
}

export interface MessagesPage {
  items: Message[];
  nextCursor: string | null;
  hasMore: boolean;
}

export const chatApi = {
  async history(roomId: string, cursor?: string, limit = 30): Promise<MessagesPage> {
    const { data } = await api.get<MessagesPage>(`/rooms/${roomId}/messages`, {
      params: { limit, ...(cursor ? { cursor } : {}) },
    });
    return data;
  },
};
