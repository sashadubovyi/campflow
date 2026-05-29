import { api } from './client';

export interface Contact {
  id: string;
  addedAt: string;
  isMutual: boolean;
  user: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl: string | null;
    lastSeenAt: string;
    isOnline: boolean;
    city: string | null;
  };
}

export const contactsApi = {
  async list(): Promise<Contact[]> {
    const { data } = await api.get<Contact[]>('/contacts');
    return data;
  },
  async add(contactId: string): Promise<{ id: string }> {
    const { data } = await api.post<{ id: string }>('/contacts', { contactId });
    return data;
  },
  async remove(contactId: string): Promise<{ removed: boolean }> {
    const { data } = await api.delete<{ removed: boolean }>(`/contacts/${contactId}`);
    return data;
  },
};
