import { api } from './client';

export interface RoomListItem {
  id: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  inviteCode: string;
  startsAt: string | null;
  endsAt: string | null;
  ownerId: string;
  memberCount: number;
  isPublic: boolean;
  status?: 'open' | 'closed';
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  admin: { id: string; fullName: string; avatarUrl: string | null } | null;
}

export interface PublicRoomItem {
  id: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  startsAt: string | null;
  endsAt: string | null;
  ownerId: string;
  memberCount: number;
  isPublic: boolean;
  status: 'active' | 'closed';
  createdAt: string;
  updatedAt: string;
  admin: { id: string; fullName: string; avatarUrl: string | null } | null;
  isMember: boolean;
}

export interface RoomMember {
  id: string;
  role: 'admin' | 'member';
  joinedAt: string;
  user: {
    id: string;
    username: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    isOnline: boolean;
    lastSeenAt: string;
  };
}

export interface RoomDetails extends RoomListItem {
  currentUserRole: 'admin' | 'member';
  members: RoomMember[];
}

export interface CreateRoomPayload {
  name: string;
  description?: string;
  startsAt?: string;
  endsAt?: string;
  isPublic?: boolean;
}

export interface UpdateRoomPayload {
  name?: string;
  description?: string;
  startsAt?: string | null;
  endsAt?: string | null;
  isPublic?: boolean;
}

export const roomsApi = {
  async list(): Promise<RoomListItem[]> {
    const { data } = await api.get<RoomListItem[]>('/rooms');
    return data;
  },
  async listPublic(): Promise<PublicRoomItem[]> {
    const { data } = await api.get<PublicRoomItem[]>('/rooms/public');
    return data;
  },
  async create(payload: CreateRoomPayload): Promise<RoomListItem> {
    const { data } = await api.post<RoomListItem>('/rooms', payload);
    return data;
  },
  async join(inviteCode: string): Promise<RoomDetails> {
    const { data } = await api.post<RoomDetails>('/rooms/join', { inviteCode });
    return data;
  },
  async get(id: string): Promise<RoomDetails> {
    const { data } = await api.get<RoomDetails>(`/rooms/${id}`);
    return data;
  },
  async close(id: string): Promise<void> {
    await api.post(`/rooms/${id}/close`);
  },
  async archive(id: string): Promise<void> {
    await api.delete(`/rooms/${id}`);
  },
  async update(id: string, payload: UpdateRoomPayload): Promise<RoomDetails> {
    const { data } = await api.patch<RoomDetails>(`/rooms/${id}`, payload);
    return data;
  },
  async uploadCover(id: string, file: File): Promise<{ coverUrl: string }> {
    const form = new FormData();
    form.append('cover', file);
    const { data } = await api.post<{ coverUrl: string }>(`/rooms/${id}/cover`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};
