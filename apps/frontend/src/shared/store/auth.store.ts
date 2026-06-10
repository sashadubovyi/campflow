import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../api/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isInitialized: boolean;
  setAuth: (user: User, accessToken: string) => void;
  setUser: (user: User) => void;
  setToken: (accessToken: string) => void;
  clear: () => void;
  setInitialized: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isInitialized: false,
      setAuth: (user, accessToken) => set({ user, accessToken }),
      setUser: (user) => set({ user }),
      setToken: (accessToken) => set({ accessToken }),
      clear: () => set({ user: null, accessToken: null }),
      setInitialized: (value) => set({ isInitialized: value }),
    }),
    {
      name: 'au-session',
      // avatarUrl can be a 2-3 MB base64 string — don't persist it to localStorage
      // to avoid silent quota failures. It is re-fetched fresh on every bootstrap.
      partialize: (state) => ({
        user: state.user ? { ...state.user, avatarUrl: null } : null,
      }),
    },
  ),
);
