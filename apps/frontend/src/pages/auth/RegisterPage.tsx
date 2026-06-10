import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../shared/store/useAuth';
import { LanguageSwitcher } from '../../shared/ui/LanguageSwitcher';
import { OAuthButtons } from './OAuthButtons';
import type { AxiosError } from 'axios';
import type { ApiError } from '../../shared/api/types';

interface RegisterForm {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
}

export function RegisterPage() {
  const { t } = useTranslation();
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>();

  async function onSubmit(values: RegisterForm) {
    setServerError(null);
    try {
      await registerUser({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        phone: values.phone || undefined,
      });
      navigate('/onboarding');
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      const msg = axiosErr.response?.data?.message;
      const text = Array.isArray(msg) ? msg[0] : msg;
      setServerError(text || t('common.error'));
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-6 py-10 relative">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-neutral-900">
            &amp;<span className="text-accent-600">u</span>
          </h1>
          <p className="font-body text-neutral-700 mt-2">{t('auth.registerTitle')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-neutral-900/5 border border-neutral-100 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 font-body">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                {t('auth.fullName')}
              </label>
              <input
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-100 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none transition"
                placeholder="Іван Петренко"
                {...register('fullName', {
                  required: true,
                  minLength: { value: 2, message: '' },
                })}
              />
              {errors.fullName && <p className="text-red-500 text-xs mt-1">{t('auth.fullName')}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                {t('auth.email')}
              </label>
              <input
                type="email"
                autoComplete="email"
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-100 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none transition"
                placeholder="you@example.com"
                {...register('email', { required: true })}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{t('auth.email')}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                {t('auth.password')}
              </label>
              <input
                type="password"
                autoComplete="new-password"
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-100 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none transition"
                placeholder="••••••••"
                {...register('password', {
                  required: true,
                  minLength: { value: 8, message: '' },
                  pattern: {
                    value: /^(?=.*[A-Za-z])(?=.*\d).+$/,
                    message: '',
                  },
                })}
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{t('auth.password')}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                {t('auth.phoneOptional')}
              </label>
              <input
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-100 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none transition"
                placeholder="+380..."
                {...register('phone')}
              />
            </div>

            {serverError && (
              <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{serverError}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-brand-gradient hover:bg-brand-gradient-hover disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition"
            >
              {isSubmitting ? t('common.loading') : t('auth.register')}
            </button>
          </form>

          <div className="mt-6">
            <OAuthButtons context="signup" />
          </div>
        </div>

        <p className="text-center text-neutral-700 text-sm mt-6 font-body">
          {t('auth.haveAccount')}{' '}
          <Link to="/login" className="text-accent-600 font-semibold hover:underline">
            {t('auth.login')}
          </Link>
        </p>
      </div>
    </div>
  );
}
