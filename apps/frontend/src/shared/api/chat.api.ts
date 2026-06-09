import { api } from './client';

export interface ReplyPreview {
  id: string;
  content: string;
  authorId: string | null;
  author: { id: string; fullName: string } | null;
}

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
  replyToId?: string | null;
  replyTo?: ReplyPreview | null;
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
