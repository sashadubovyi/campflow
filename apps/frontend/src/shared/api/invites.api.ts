import { api } from './client';

export interface InviteIncoming {
  id: string;
  roomId: string;
  invitedById: string;
  invitedUserId: string;
  status: 'pending' | 'deferred';
  message: string | null;
  createdAt: string;
  room: {
    id: string;
    name: string;
    eventDate: string | null;
    startsAt: string | null;
    endsAt: string | null;
  };
  invitedBy: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl: string | null;
  };
}

export type CanInviteReason =
  | 'not_found'
  | 'self'
  | 'already_member'
  | 'already_invited'
  | 'blocked_by_policy';

export interface CanInviteResult {
  allowed: boolean;
  reason?: CanInviteReason;
  target?: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl: string | null;
  };
}

export const invitesApi = {
  async canInvite(roomId: string, username: string): Promise<CanInviteResult> {
    const { data } = await api.get<CanInviteResult>(`/rooms/${roomId}/can-invite`, {
      params: { username },
    });
    return data;
  },

  async create(roomId: string, username: string, message?: string) {
    const { data } = await api.post(`/rooms/${roomId}/invites`, { username, message });
    return data;
  },

  async myIncoming(): Promise<InviteIncoming[]> {
    const { data } = await api.get<InviteIncoming[]>('/invites/incoming');
    return data;
  },

  async accept(inviteId: string): Promise<{ ok: boolean; roomId: string }> {
    const { data } = await api.post(`/invites/${inviteId}/accept`);
    return data;
  },

  async decline(inviteId: string) {
    const { data } = await api.post(`/invites/${inviteId}/decline`);
    return data;
  },

  async defer(inviteId: string) {
    const { data } = await api.post(`/invites/${inviteId}/defer`);
    return data;
  },
};
