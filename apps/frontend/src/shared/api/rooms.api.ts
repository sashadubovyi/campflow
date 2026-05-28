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
  createdAt: string;
  updatedAt: string;
}

export interface RoomMember {
  id: string;
  role: 'admin' | 'member';
  joinedAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
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
}

export const roomsApi = {
  async list(): Promise<RoomListItem[]> {
    const { data } = await api.get<RoomListItem[]>('/rooms');
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
};
