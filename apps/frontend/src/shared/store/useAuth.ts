import { useAuthStore } from './auth.store';
import { authApi, type LoginPayload, type RegisterPayload } from '../api/auth.api';

export function useAuth() {
  const { user, accessToken, isInitialized, setAuth, clear, setUser, setInitialized } =
    useAuthStore();

  async function login(payload: LoginPayload) {
    const res = await authApi.login(payload);
    setAuth(res.user, res.accessToken);
    return res.user;
  }

  async function register(payload: RegisterPayload) {
    const res = await authApi.register(payload);
    setAuth(res.user, res.accessToken);
    return res.user;
  }

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      clear();
    }
  }

  // Спроба відновити сесію при завантаженні застосунку:
  // refresh-cookie ще жива → отримуємо новий access-токен + профіль
  async function bootstrap() {
    try {
      const { accessToken } = await authApi.refresh();
      useAuthStore.getState().setToken(accessToken);
      const me = await authApi.me();
      setUser(me);
    } catch {
      clear();
    } finally {
      setInitialized(true);
    }
  }

  return {
    user,
    accessToken,
    isInitialized,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    bootstrap,
  };
}
