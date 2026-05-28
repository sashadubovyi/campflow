import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/store/useAuth';
import type { AxiosError } from 'axios';
import type { ApiError } from '../../shared/api/types';

interface RegisterForm {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
}

export function RegisterPage() {
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
      navigate('/rooms');
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      const msg = axiosErr.response?.data?.message;
      const text = Array.isArray(msg) ? msg[0] : msg;
      setServerError(text || 'Не вдалося зареєструватися');
    }
  }

  return (
    <div className="min-h-screen bg-forest-50 flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold text-forest-900">
            Camp<span className="text-ember-500">Flow</span>
          </h1>
          <p className="font-body text-forest-700 mt-2">Створіть акаунт</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-forest-900/5 border border-forest-100 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 font-body">
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1.5">
                Повне ім'я
              </label>
              <input
                className="w-full px-4 py-2.5 rounded-xl border border-forest-100 focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 outline-none transition"
                placeholder="Іван Петренко"
                {...register('fullName', {
                  required: "Введіть ім'я",
                  minLength: { value: 2, message: 'Мінімум 2 символи' },
                })}
              />
              {errors.fullName && (
                <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1.5">Email</label>
              <input
                type="email"
                autoComplete="email"
                className="w-full px-4 py-2.5 rounded-xl border border-forest-100 focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 outline-none transition"
                placeholder="you@example.com"
                {...register('email', { required: 'Введіть email' })}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1.5">Пароль</label>
              <input
                type="password"
                autoComplete="new-password"
                className="w-full px-4 py-2.5 rounded-xl border border-forest-100 focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 outline-none transition"
                placeholder="Мінімум 8 символів, літери та цифри"
                {...register('password', {
                  required: 'Введіть пароль',
                  minLength: { value: 8, message: 'Мінімум 8 символів' },
                  pattern: {
                    value: /^(?=.*[A-Za-z])(?=.*\d).+$/,
                    message: 'Пароль має містити літери та цифри',
                  },
                })}
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1.5">
                Телефон <span className="text-forest-500 font-normal">(необов'язково)</span>
              </label>
              <input
                className="w-full px-4 py-2.5 rounded-xl border border-forest-100 focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 outline-none transition"
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
              className="w-full bg-forest-600 hover:bg-forest-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition"
            >
              {isSubmitting ? 'Реєстрація…' : 'Зареєструватися'}
            </button>
          </form>
        </div>

        <p className="text-center text-forest-700 text-sm mt-6 font-body">
          Вже маєте акаунт?{' '}
          <Link to="/login" className="text-ember-500 font-semibold hover:underline">
            Увійти
          </Link>
        </p>
      </div>
    </div>
  );
}