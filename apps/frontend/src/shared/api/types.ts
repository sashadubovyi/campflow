export type Locale = 'uk' | 'en' | 'ru';

export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  locale: Locale;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface ApiError {
  message: string | string[];
  error: string;
  statusCode: number;
}
