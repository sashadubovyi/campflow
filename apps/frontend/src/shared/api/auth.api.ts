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

// Refresh token зберігається в localStorage як fallback для mobile Safari,
// де cross-site httpOnly cookies блокуються ITP.
const RT_KEY = 'au_rt';

export function saveRefreshToken(token?: string) {
  if (token) localStorage.setItem(RT_KEY, token);
}

export function loadRefreshToken(): string | null {
  return localStorage.getItem(RT_KEY);
}

export function clearRefreshToken() {
  localStorage.removeItem(RT_KEY);
}

export const authApi = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse & { refreshToken?: string }>('/auth/register', payload);
    saveRefreshToken(data.refreshToken);
    return data;
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse & { refreshToken?: string }>('/auth/login', payload);
    saveRefreshToken(data.refreshToken);
    return data;
  },

  async logout(): Promise<void> {
    // Локальний токен чистимо ЗАВЖДИ, навіть якщо запит впав (офлайн, 500) —
    // інакше на shared-девайсі bootstrap() тихо залогінить юзера назад.
    try {
      await api.post('/auth/logout');
    } finally {
      clearRefreshToken();
    }
  },

  async me(): Promise<User> {
    const { data } = await api.get<User>('/auth/me');
    return data;
  },

  async refresh(): Promise<{ accessToken: string }> {
    const stored = loadRefreshToken();
    const { data } = await api.post<{ accessToken: string; refreshToken?: string }>(
      '/auth/refresh',
      stored ? { refreshToken: stored } : {},
    );
    saveRefreshToken(data.refreshToken);
    return { accessToken: data.accessToken };
  },

  async oauthGoogle(idToken: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse & { refreshToken?: string }>('/auth/oauth/google', { idToken });
    saveRefreshToken(data.refreshToken);
    return data;
  },

  async oauthApple(idToken: string, fullName?: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse & { refreshToken?: string }>('/auth/oauth/apple', { idToken, fullName });
    saveRefreshToken(data.refreshToken);
    return data;
  },

  async oauthFacebook(accessToken: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse & { refreshToken?: string }>('/auth/oauth/facebook', { idToken: accessToken });
    saveRefreshToken(data.refreshToken);
    return data;
  },
};
