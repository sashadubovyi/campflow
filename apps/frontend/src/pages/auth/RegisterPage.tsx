import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { m } from 'framer-motion';
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

  const fieldClass = 'w-full px-4 py-2.5 rounded-2xl text-neutral-900 placeholder:text-neutral-400/80 glass-input';
  const labelClass = 'block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2';

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10 relative overflow-hidden">
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>

      <m.div
        initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
        className="w-full max-w-sm"
      >
        {/* Brand mark */}
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold">
            <span className="bg-clip-text text-transparent bg-brand-gradient">&amp;</span>
            <span className="text-neutral-800">u</span>
          </h1>
          <p className="text-neutral-600 mt-2 text-sm">{t('auth.registerTitle')}</p>
        </div>

        {/* Glass card */}
        <div className="glass-surface rounded-card-lg p-7">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 font-body">
            <div>
              <label className={labelClass}>{t('auth.fullName')}</label>
              <input
                className={fieldClass}
                placeholder="Іван Петренко"
                {...register('fullName', { required: true, minLength: { value: 2, message: '' } })}
              />
              {errors.fullName && <p className="text-danger-700 text-xs mt-1.5">{t('auth.fullName')}</p>}
            </div>

            <div>
              <label className={labelClass}>{t('auth.email')}</label>
              <input
                type="email"
                autoComplete="email"
                className={fieldClass}
                placeholder="you@example.com"
                {...register('email', { required: true })}
              />
              {errors.email && <p className="text-danger-700 text-xs mt-1.5">{t('auth.email')}</p>}
            </div>

            <div>
              <label className={labelClass}>{t('auth.password')}</label>
              <input
                type="password"
                autoComplete="new-password"
                className={fieldClass}
                placeholder="••••••••"
                {...register('password', {
                  required: true,
                  minLength: { value: 8, message: '' },
                  pattern: { value: /^(?=.*[A-Za-z])(?=.*\d).+$/, message: '' },
                })}
              />
              {errors.password && <p className="text-danger-700 text-xs mt-1.5">{t('auth.password')}</p>}
            </div>

            <div>
              <label className={labelClass}>{t('auth.phoneOptional')}</label>
              <input
                className={fieldClass}
                placeholder="+380..."
                {...register('phone')}
              />
            </div>

            {serverError && (
              <div className="bg-danger-500/10 border border-danger-500/25 rounded-2xl px-4 py-2.5">
                <p className="text-danger-700 text-sm">{serverError}</p>
              </div>
            )}

            <m.button
              type="submit"
              disabled={isSubmitting}
              whileTap={isSubmitting ? undefined : { scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="w-full btn-glass-blue py-2.5 rounded-2xl font-semibold text-sm mt-2"
            >
              {isSubmitting ? t('common.loading') : t('auth.register')}
            </m.button>
          </form>

          <div className="mt-5">
            <OAuthButtons context="signup" />
          </div>
        </div>

        <p className="text-center text-neutral-600 text-sm mt-5 font-body">
          {t('auth.haveAccount')}{' '}
          <Link to="/login" className="text-accent-600 font-semibold hover:text-accent-500 transition-colors">
            {t('auth.login')}
          </Link>
        </p>
        <p className="text-center text-xs text-neutral-400 mt-3 font-body">
          Реєструючись, ви погоджуєтеся з{' '}
          <Link to="/privacy" className="hover:underline hover:text-neutral-600 transition-colors">
            Політикою конфіденційності
          </Link>
          {' та '}
          <Link to="/offer" className="hover:underline hover:text-neutral-600 transition-colors">
            Публічною офертою
          </Link>
        </p>
      </m.div>
    </div>
  );
}
