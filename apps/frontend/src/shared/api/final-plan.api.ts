import { api } from './client';

export type FinalPlanCategory = 'decision' | 'location' | 'item';

export interface FinalPlanAssignee {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
}

export interface FinalPlanItem {
  id: string;
  pollId: string;
  title: string;
  category: FinalPlanCategory;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  assignee: FinalPlanAssignee | null;
  payload: unknown;
  approvedAt: string;
}

export interface FinalPlan {
  roomId: string;
  items: FinalPlanItem[];
  grouped: {
    decisions: FinalPlanItem[];
    locations: FinalPlanItem[];
    items: FinalPlanItem[];
  };
}

export const finalPlanApi = {
  async get(roomId: string): Promise<FinalPlan> {
    const { data } = await api.get<FinalPlan>(`/rooms/${roomId}/final-plan`);
    return data;
  },
};
