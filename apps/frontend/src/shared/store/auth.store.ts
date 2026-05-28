import { create } from 'zustand';
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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isInitialized: false,
  setAuth: (user, accessToken) => set({ user, accessToken }),
  setUser: (user) => set({ user }),
  setToken: (accessToken) => set({ accessToken }),
  clear: () => set({ user: null, accessToken: null }),
  setInitialized: (value) => set({ isInitialized: value }),
}));
