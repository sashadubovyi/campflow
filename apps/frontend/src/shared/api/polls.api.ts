import { api } from './client';

export type PollType = 'single_choice' | 'multi_choice' | 'location';
export type PollStatus = 'open' | 'closed' | 'reopened' | 'approved';

export interface PollOption {
  id: string;
  label: string;
  position: number;
  votes: number;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  assignedTo: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  } | null;
}

export interface PollDetails {
  id: string;
  roomId: string;
  type: PollType;
  status: PollStatus;
  title: string;
  description: string | null;
  allowAssign: boolean;
  deadline: string | null;
  createdById: string;
  createdAt: string;
  options: PollOption[];
  progress: {
    voted: number;
    total: number;
  };
  myVotes: string[]; // ids опцій, за які я проголосував
}

// === DTO для створення ===

export interface CreateSinglePollPayload {
  roomId: string;
  title: string;
  description?: string;
  options: { label: string }[];
}

export interface CreateMultiPollPayload {
  roomId: string;
  title: string;
  description?: string;
  allowAssign?: boolean;
  options: { label: string }[];
}

export interface CreateLocationPollPayload {
  roomId: string;
  title: string;
  description?: string;
  options: {
    label: string;
    latitude: number;
    longitude: number;
    address?: string;
  }[];
}

// === API ===

export const pollsApi = {
  async listByRoom(roomId: string): Promise<PollDetails[]> {
    const { data } = await api.get<PollDetails[]>(`/polls/room/${roomId}`);
    return data;
  },

  async get(id: string): Promise<PollDetails> {
    const { data } = await api.get<PollDetails>(`/polls/${id}`);
    return data;
  },

  async createSingle(payload: CreateSinglePollPayload): Promise<PollDetails> {
    const { data } = await api.post<PollDetails>('/polls', payload);
    return data;
  },

  async createMulti(payload: CreateMultiPollPayload): Promise<PollDetails> {
    const { data } = await api.post<PollDetails>('/polls/multi', payload);
    return data;
  },

  async createLocation(payload: CreateLocationPollPayload): Promise<PollDetails> {
    const { data } = await api.post<PollDetails>('/polls/location', payload);
    return data;
  },

  async vote(pollId: string, optionId: string): Promise<PollDetails> {
    const { data } = await api.post<PollDetails>(`/polls/${pollId}/vote`, { optionId });
    return data;
  },

  async toggleVote(pollId: string, optionId: string): Promise<PollDetails> {
    const { data } = await api.post<PollDetails>(`/polls/${pollId}/toggle-vote`, { optionId });
    return data;
  },

  async assignOption(optionId: string, userId: string | null): Promise<PollOption> {
    const { data } = await api.post<PollOption>(`/polls/options/${optionId}/assign`, { userId });
    return data;
  },

  async close(pollId: string): Promise<PollDetails> {
    const { data } = await api.post<PollDetails>(`/polls/${pollId}/close`);
    return data;
  },

  async reopen(pollId: string): Promise<PollDetails> {
    const { data } = await api.post<PollDetails>(`/polls/${pollId}/reopen`);
    return data;
  },

  async approve(pollId: string, optionIds: string[]): Promise<PollDetails> {
    const { data } = await api.post<PollDetails>(`/polls/${pollId}/approve`, { optionIds });
    return data;
  },
};
