import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/store/useAuth';

interface LoginForm {
  email: string;
  password: string;
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
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
      navigate('/rooms');
    } catch {
      setServerError('Невірний email або пароль');
    }
  }

  return (
    <div className="min-h-screen bg-forest-50 flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold text-forest-900">
            Camp<span className="text-ember-500">Flow</span>
          </h1>
          <p className="font-body text-forest-700 mt-2">З поверненням!</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-forest-900/5 border border-forest-100 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 font-body">
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1.5">Email</label>
              <input
                type="email"
                autoComplete="email"
                className="w-full px-4 py-2.5 rounded-xl border border-forest-100 focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 outline-none transition"
                placeholder="you@example.com"
                {...register('email', { required: 'Введіть email' })}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1.5">Пароль</label>
              <input
                type="password"
                autoComplete="current-password"
                className="w-full px-4 py-2.5 rounded-xl border border-forest-100 focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 outline-none transition"
                placeholder="••••••••"
                {...register('password', { required: 'Введіть пароль' })}
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            {serverError && (
              <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{serverError}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-forest-600 hover:bg-forest-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition"
            >
              {isSubmitting ? 'Вхід…' : 'Увійти'}
            </button>
          </form>
        </div>

        <p className="text-center text-forest-700 text-sm mt-6 font-body">
          Немає акаунту?{' '}
          <Link to="/register" className="text-ember-500 font-semibold hover:underline">
            Зареєструватися
          </Link>
        </p>
      </div>
    </div>
  );
}
