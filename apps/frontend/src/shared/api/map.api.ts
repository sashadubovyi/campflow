import { api } from './client';

export interface MapPoint {
  id: string;
  roomId: string;
  roomName: string;
  label: string;
  address: string | null;
  latitude: number;
  longitude: number;
  approved: boolean;
}

export const mapApi = {
  async getPoints(): Promise<MapPoint[]> {
    const { data } = await api.get<MapPoint[]>('/map/points');
    return data;
  },
};
