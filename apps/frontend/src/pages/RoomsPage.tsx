import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, KeyRound } from 'lucide-react';
import { usePublicRooms } from '../shared/api/rooms.hooks';
import { PublicRoomCard } from './feed/PublicRoomCard';
import { PageHeader } from '../shared/ui';
import { CreateRoomModal } from './rooms/CreateRoomModal';
import { JoinRoomModal } from './rooms/JoinRoomModal';

export function RoomsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: rooms, isLoading, isError } = usePublicRooms();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  return (
    <div className="h-full flex flex-col bg-neutral-50 overflow-hidden">
      <PageHeader
        title={<span className="font-display">&amp; Spaces</span>}
        left={
          <button
            onClick={() => setShowJoin(true)}
            title={t('rooms.joinByCode')}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-accent-50 text-accent-500 hover:bg-accent-100 transition"
          >
            <KeyRound size={18} />
          </button>
        }
        right={
          <button
            onClick={() => setShowCreate(true)}
            title={t('common.create')}
            className="flex items-center gap-1.5 bg-brand-gradient hover:bg-brand-gradient-hover text-white rounded-xl px-3 h-9 text-sm font-semibold transition"
          >
            <Plus size={16} />
            <span className="hidden md:inline">{t('common.create')}</span>
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto">
        <main className="max-w-5xl mx-auto w-full px-4 md:px-6 py-4">
          {isLoading && (
            <p className="text-neutral-400 animate-pulse text-center py-12">{t('common.loading')}</p>
          )}
          {isError && (
            <p className="text-danger-700 bg-danger-100 rounded-lg px-4 py-3 text-center">
              {t('common.error')}
            </p>
          )}
          {!isLoading && !isError && (!rooms || rooms.length === 0) && (
            <div className="text-center py-16 px-6">
              <p className="text-lg font-semibold text-neutral-900 mb-2">
                {t('feed.emptyTitle', 'Поки порожньо у стрічці')}
              </p>
              <p className="text-sm text-neutral-500 mb-6">
                {t(
                  'feed.emptyHint',
                  'Створіть першу подію і зробіть її публічною — або приєднайтесь за кодом запрошення.',
                )}
              </p>
              <button
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-1.5 bg-brand-gradient hover:bg-brand-gradient-hover text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition"
              >
                <Plus size={16} />
                {t('rooms.newRoom', 'Створити кімнату')}
              </button>
            </div>
          )}
          {rooms && rooms.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {rooms.map((room) => (
                <PublicRoomCard key={room.id} room={room} />
              ))}
            </div>
          )}
        </main>
      </div>

      {showCreate && (
        <CreateRoomModal
          onClose={() => setShowCreate(false)}
          onCreated={(id) => {
            setShowCreate(false);
            navigate(`/rooms/${id}`);
          }}
        />
      )}
      {showJoin && (
        <JoinRoomModal
          onClose={() => setShowJoin(false)}
          onJoined={(id) => {
            setShowJoin(false);
            navigate(`/rooms/${id}`);
          }}
        />
      )}
    </div>
  );
}
