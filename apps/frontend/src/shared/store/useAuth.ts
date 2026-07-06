import { useAuthStore } from './auth.store';
import { authApi, type LoginPayload, type RegisterPayload } from '../api/auth.api';
import { queryClient } from '../api/queryClient';

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

  async function loginWithGoogle(idToken: string) {
    const res = await authApi.oauthGoogle(idToken);
    setAuth(res.user, res.accessToken);
    return res.user;
  }

  async function loginWithApple(idToken: string, fullName?: string) {
    const res = await authApi.oauthApple(idToken, fullName);
    setAuth(res.user, res.accessToken);
    return res.user;
  }

  async function loginWithFacebook(accessToken: string) {
    const res = await authApi.oauthFacebook(accessToken);
    setAuth(res.user, res.accessToken);
    return res.user;
  }

  async function logout() {
    try {
      await authApi.logout();
    } catch {
      // Сервер недоступний — не страшно: локальна сесія все одно чиститься,
      // а refresh-токен вже видалено з localStorage в authApi.logout.
    } finally {
      clear();
      queryClient.clear();
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
    } catch (err) {
      // Очищуємо сесію тільки при явній відмові від сервера (401/403).
      // Мережеві помилки або таймаути не повинні виганяти користувача —
      // особливо на мобільних де cookie/мережа можуть бути тимчасово недоступні.
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401 || status === 403) {
        clear();
      }
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
    loginWithGoogle,
    loginWithApple,
    loginWithFacebook,
    logout,
    bootstrap,
  };
}
