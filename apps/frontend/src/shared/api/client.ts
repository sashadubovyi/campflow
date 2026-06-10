import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/auth.store';
import { loadRefreshToken, saveRefreshToken } from './auth.api';

const baseUrl = import.meta.env.VITE_API_URL || '';
const cleanUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

export const api = axios.create({
  baseURL: `${cleanUrl}/api`,
  withCredentials: true, // щоб refresh-cookie ходила
});

// Підставляємо access-токен у кожен запит
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh при 401
let isRefreshing = false;
let queue: { resolve: (token: string) => void; reject: (err: unknown) => void }[] = [];

function processQueue(error: unknown, token: string | null) {
  queue.forEach((p) => {
    if (token) p.resolve(token);
    else p.reject(error);
  });
  queue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Не чіпаємо помилки самого refresh/login/register
    const url = original?.url ?? '';
    const isAuthRoute =
      url.includes('/auth/refresh') ||
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/oauth');

    if (error.response?.status === 401 && !original._retry && !isAuthRoute) {
      if (isRefreshing) {
        // Чекаємо, поки завершиться поточний refresh
        return new Promise((resolve, reject) => {
          queue.push({
            resolve: (token) => {
              original.headers.Authorization = `Bearer ${token}`;
              resolve(api(original));
            },
            reject,
          });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const stored = loadRefreshToken();
        const { data } = await api.post<{ accessToken: string; refreshToken?: string }>(
          '/auth/refresh',
          stored ? { refreshToken: stored } : {},
        );
        if (data.refreshToken) saveRefreshToken(data.refreshToken);
        const newToken = data.accessToken;
        useAuthStore.getState().setToken(newToken);
        processQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().clear();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
