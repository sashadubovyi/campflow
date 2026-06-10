import { api } from './client';

export type Gender = 'male' | 'female' | 'unspecified';
export type Visibility = 'public' | 'contacts' | 'hidden';
export type InvitePolicy = 'all' | 'contacts' | 'none';
export type Locale = 'uk' | 'en' | 'ru';

export interface UserLookupResult {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
}

export type UserSearchBy = 'auto' | 'username' | 'email' | 'phone' | 'name';

export interface UserSearchResult {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  city: string | null;
  lastSeenAt: string;
  isOnline: boolean;
}

export interface PublicProfile {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  coverUrl: string | null;
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
  threads: string | null;
  isSelf: boolean;
  isContact: boolean;
  isMutual: boolean;
  isBlockedByMe?: boolean;
  createdAt: string;
  stats: {
    sharedRooms: number;
    contacts: number;
  };
}

export interface MyProfile {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  locale: Locale;
  bio: string | null;
  city: string | null;
  birthDate: string | null;
  gender: Gender | null;
  hobbies: string[];
  hobbiesCustom: string | null;
  telegram: string | null;
  whatsapp: string | null;
  instagram: string | null;
  facebook: string | null;
  threads: string | null;
  emailVisibility: Visibility;
  phoneVisibility: Visibility;
  telegramVisibility: Visibility;
  whatsappVisibility: Visibility;
  instagramVisibility: Visibility;
  facebookVisibility: Visibility;
  threadsVisibility: Visibility;
  inviteFrom: InvitePolicy;
  createdAt: string;
}

export type UpdateProfilePayload = Partial<
  Omit<MyProfile, 'id' | 'username' | 'email' | 'avatarUrl' | 'createdAt'>
>;

export const profileApi = {
  async lookup(username: string): Promise<UserLookupResult> {
    const { data } = await api.get<UserLookupResult>('/users/lookup', { params: { username } });
    return data;
  },

  async search(q: string, by: UserSearchBy = 'auto'): Promise<UserSearchResult[]> {
    const { data } = await api.get<UserSearchResult[]>('/users/search', { params: { q, by } });
    return data;
  },

  async getProfile(username: string): Promise<PublicProfile> {
    const { data } = await api.get<PublicProfile>(`/users/${username}`);
    return data;
  },

  async getMyProfile(): Promise<MyProfile> {
    const { data } = await api.get<MyProfile>('/users/me');
    return data;
  },

  async updateMyProfile(payload: UpdateProfilePayload): Promise<MyProfile> {
    const { data } = await api.patch<MyProfile>('/users/me', payload);
    return data;
  },

  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    const form = new FormData();
    form.append('avatar', file);
    const { data } = await api.post<{ avatarUrl: string }>('/users/me/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async uploadCover(file: File): Promise<{ coverUrl: string }> {
    const form = new FormData();
    form.append('cover', file);
    const { data } = await api.post<{ coverUrl: string }>('/users/me/cover', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};
