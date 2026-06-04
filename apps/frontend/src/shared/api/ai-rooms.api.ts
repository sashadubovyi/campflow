import { api } from './client';

export interface DraftPoll {
  kind: 'single_choice' | 'multi_choice' | 'location';
  question: string;
  options?: string[];
  geoQuery?: { area: string; category: string; limit: number };
  resolvedPlaces?: { label: string; latitude: number; longitude: number; address: string }[];
}

export interface RoomDraft {
  room: { name: string; description: string | null; eventDate: string | null };
  polls: DraftPoll[];
}

export const aiRoomsApi = {
  async draft(prompt: string): Promise<RoomDraft> {
    const { data } = await api.post<RoomDraft>('/rooms/ai-draft', { prompt });
    return data;
  },
};
