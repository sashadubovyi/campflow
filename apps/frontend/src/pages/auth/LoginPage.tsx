import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { m } from 'framer-motion';
import { useAuth } from '../../shared/store/useAuth';
import { LanguageSwitcher } from '../../shared/ui/LanguageSwitcher';
import { OAuthButtons } from './OAuthButtons';

interface LoginForm {
  email: string;
  password: string;
}

export function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>();

  async function onSubmit(values: LoginForm) {
    setServerError(null);
    try {
      await login(values);
      navigate(redirect || '/rooms');
    } catch {
      setServerError(t('auth.invalidCredentials'));
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
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
          <p className="text-neutral-600 mt-2 text-sm">{t('auth.loginTitle')}</p>
        </div>

        {/* Glass card */}
        <div className="glass-surface rounded-card-lg p-7 space-y-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 font-body">
            <div>
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                {t('auth.email')}
              </label>
              <input
                type="email"
                autoComplete="email"
                className="w-full px-4 py-2.5 rounded-2xl text-neutral-900 placeholder:text-neutral-400/80 glass-input"
                placeholder="you@example.com"
                {...register('email', { required: true })}
              />
              {errors.email && (
                <p className="text-danger-700 text-xs mt-1.5">{t('auth.email')}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                {t('auth.password')}
              </label>
              <input
                type="password"
                autoComplete="current-password"
                className="w-full px-4 py-2.5 rounded-2xl text-neutral-900 placeholder:text-neutral-400/80 glass-input"
                placeholder="••••••••"
                {...register('password', { required: true })}
              />
              {errors.password && (
                <p className="text-danger-700 text-xs mt-1.5">{t('auth.password')}</p>
              )}
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
              className="w-full btn-glass-blue py-2.5 rounded-2xl font-semibold text-sm"
            >
              {isSubmitting ? t('common.loading') : t('auth.login')}
            </m.button>
          </form>

          <OAuthButtons context="signin" />
        </div>

        <p className="text-center text-neutral-600 text-sm mt-5 font-body">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="text-accent-600 font-semibold hover:text-accent-500 transition-colors">
            {t('auth.register')}
          </Link>
        </p>
        <p className="text-center text-xs text-neutral-400 mt-3 font-body">
          <Link to="/privacy" className="hover:underline hover:text-neutral-600 transition-colors">
            Політика конфіденційності
          </Link>
        </p>
      </m.div>
    </div>
  );
}
