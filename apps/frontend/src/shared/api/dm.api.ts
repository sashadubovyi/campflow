import { api } from './client';

export interface DmPeer {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  lastSeenAt: string;
  isOnline: boolean;
}

export interface DmChatListItem {
  id: string;
  peer: DmPeer;
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    isOwn: boolean;
  } | null;
  lastMessageAt: string;
}

export interface DmChatDetails {
  id: string;
  peer: DmPeer;
  lastMessageAt: string;
}

export interface DmMessage {
  id: string;
  content: string;
  createdAt: string;
  isOwn: boolean;
  replyTo?: {
    id: string;
    content: string;
    isOwn: boolean;
  } | null;
}

export const dmApi = {
  async list(): Promise<DmChatListItem[]> {
    const { data } = await api.get<DmChatListItem[]>('/dm');
    return data;
  },
  async getOrCreate(username: string): Promise<DmChatDetails> {
    const { data } = await api.get<DmChatDetails>(`/dm/with/${username}`);
    return data;
  },
  async get(chatId: string): Promise<DmChatDetails> {
    const { data } = await api.get<DmChatDetails>(`/dm/${chatId}`);
    return data;
  },
  async messages(chatId: string): Promise<DmMessage[]> {
    const { data } = await api.get<DmMessage[]>(`/dm/${chatId}/messages`);
    return data;
  },
  async send(chatId: string, content: string, replyToId?: string): Promise<DmMessage> {
    const { data } = await api.post<DmMessage>(`/dm/${chatId}/messages`, {
      content,
      ...(replyToId ? { replyToId } : {}),
    });
    return data;
  },
  async deleteChat(chatId: string): Promise<void> {
    await api.delete(`/dm/${chatId}`);
  },
};
