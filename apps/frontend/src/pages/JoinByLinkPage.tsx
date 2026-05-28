import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../shared/store/useAuth';
import { roomsApi } from '../shared/api/rooms.api';

export function JoinByLinkPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isInitialized } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const attempted = useRef(false);

  useEffect(() => {
    // Чекаємо, поки завершиться відновлення сесії
    if (!isInitialized) return;

    // Не залогінений → на логін, із запам'ятовуванням куди повернутись
    if (!isAuthenticated) {
      navigate(`/login?redirect=/join/${code}`, { replace: true });
      return;
    }

    // Приєднуємось лише раз
    if (attempted.current || !code) return;
    attempted.current = true;

    roomsApi
      .join(code.toUpperCase())
      .then((room) => {
        navigate(`/rooms/${room.id}`, { replace: true });
      })
      .catch((err) => {
        // Якщо вже учасник — бекенд віддає 409, але кімната існує.
        // Спробуємо просто перейти до списку кімнат.
        const status = err?.response?.status;
        if (status === 409) {
          setError('Ви вже учасник цієї кімнати.');
        } else {
          setError('Не вдалося приєднатися. Можливо, код недійсний.');
        }
      });
  }, [isInitialized, isAuthenticated, code, navigate]);

  return (
    <div className="min-h-screen bg-forest-50 flex items-center justify-center px-6">
      <div className="text-center font-body">
        <h1 className="font-display text-3xl font-bold text-forest-900 mb-4">
          Camp<span className="text-ember-500">Flow</span>
        </h1>
        {!error ? (
          <p className="text-forest-700 animate-pulse">Приєднання до кімнати…</p>
        ) : (
          <div>
            <p className="text-forest-700 mb-4">{error}</p>
            <button
              onClick={() => navigate('/rooms')}
              className="bg-forest-600 hover:bg-forest-700 text-white font-semibold px-5 py-2.5 rounded-xl transition"
            >
              До моїх кімнат
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
