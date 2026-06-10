import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../shared/store/useAuth';
import { roomsApi } from '../shared/api/rooms.api';

export function JoinByLinkPage() {
  const { t } = useTranslation();
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isInitialized } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const attempted = useRef(false);

  useEffect(() => {
    if (!isInitialized) return;

    if (!isAuthenticated) {
      navigate(`/login?redirect=/join/${code}`, { replace: true });
      return;
    }

    if (attempted.current || !code) return;
    attempted.current = true;

    roomsApi
      .join(code.toUpperCase())
      .then((room) => {
        navigate(`/rooms/${room.id}`, { replace: true });
      })
      .catch((err) => {
        const status = err?.response?.status;
        if (status === 409) {
          setError(t('invites.reasons.alreadyMember'));
        } else {
          setError(t('common.error'));
        }
      });
  }, [isInitialized, isAuthenticated, code, navigate, t]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center font-body">
        <h1 className="font-display text-lg font-bold text-neutral-900 mb-4">
          Camp<span className="text-accent-600">Flow</span>
        </h1>
        {!error ? (
          <p className="text-neutral-700 animate-pulse">{t('common.loading')}</p>
        ) : (
          <div>
            <p className="text-neutral-700 mb-4">{error}</p>
            <button
              onClick={() => navigate('/rooms')}
              className="btn-glass-blue font-semibold px-5 py-2.5 rounded-xl transition"
            >
              {t('rooms.title')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
