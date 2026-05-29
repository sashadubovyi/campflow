import { api } from './client';

export type Gender = 'male' | 'female' | 'unspecified';

export interface UserLookupResult {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
}

export interface PublicProfile {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  bio: string | null;
  city: string | null;
  birthDate: string | null;
  gender: Gender | null;
  hobbies: string[];
  hobbiesCustom: string | null;
  isOnline: boolean;
  lastSeenAt: string;
  email: string | null;
  phone: string | null;
  telegram: string | null;
  whatsapp: string | null;
  instagram: string | null;
  facebook: string | null;
  isSelf: boolean;
  isContact: boolean;
}

export const profileApi = {
  async lookup(username: string): Promise<UserLookupResult> {
    const { data } = await api.get<UserLookupResult>('/users/lookup', {
      params: { username },
    });
    return data;
  },

  async getProfile(username: string): Promise<PublicProfile> {
    const { data } = await api.get<PublicProfile>(`/users/${username}`);
    return data;
  },
};
