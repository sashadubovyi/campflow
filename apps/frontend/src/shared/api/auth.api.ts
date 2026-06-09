import { api } from './client';
import type { AuthResponse, User } from './types';

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/register', payload);
    return data;
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', payload);
    return data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async me(): Promise<User> {
    const { data } = await api.get<User>('/auth/me');
    return data;
  },

  async refresh(): Promise<{ accessToken: string }> {
    const { data } = await api.post<{ accessToken: string }>('/auth/refresh');
    return data;
  },

  async oauthGoogle(idToken: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/oauth/google', { idToken });
    return data;
  },

  async oauthApple(idToken: string, fullName?: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/oauth/apple', { idToken, fullName });
    return data;
  },

  async oauthFacebook(accessToken: string): Promise<AuthResponse> {
    // На бекенді поле DTO називається idToken — переюзаємо.
    const { data } = await api.post<AuthResponse>('/auth/oauth/facebook', { idToken: accessToken });
    return data;
  },
};
