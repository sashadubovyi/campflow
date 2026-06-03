import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useRooms } from '../shared/api/rooms.hooks';
import type { RoomListItem } from '../shared/api/rooms.api';
import { CreateRoomModal } from './rooms/CreateRoomModal';
import { JoinRoomModal } from './rooms/JoinRoomModal';
import { Users, Calendar, Plus, LogIn } from 'lucide-react';

function formatDateRange(
  startsAt: string | null,
  endsAt: string | null,
  locale: string,
): string | null {
  if (!startsAt) return null;
  const localeMap: Record<string, string> = { uk: 'uk-UA', en: 'en-US', ru: 'ru-RU' };
  const dateLocale = localeMap[locale] ?? 'uk-UA';
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' });
  return endsAt ? `${fmt(startsAt)} — ${fmt(endsAt)}` : fmt(startsAt);
}

function RoomCard({ room, onOpen }: { room: RoomListItem; onOpen: (id: string) => void }) {
  const { i18n } = useTranslation();
  const dates = formatDateRange(room.startsAt, room.endsAt, i18n.language);
  return (
    <button
      onClick={() => onOpen(room.id)}
      className="text-left w-full bg-white rounded-card shadow-card hover:shadow-card-lg transition-all duration-200 overflow-hidden group"
    >
      <div className="h-1 w-full bg-brand-gradient" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h3 className="text-base font-semibold text-neutral-900 group-hover:text-accent-600 transition leading-snug">
            {room.name}
          </h3>
          <span className="shrink-0 flex items-center gap-1 text-xs bg-neutral-100 text-neutral-500 rounded-full px-2.5 py-1 font-medium">
            <Users size={11} />
            {room.memberCount}
          </span>
        </div>
        {room.description && (
          <p className="text-sm text-neutral-500 line-clamp-2 mt-1.5">{room.description}</p>
        )}
        {dates && (
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 mt-3">
            <Calendar size={12} />
            {dates}
          </div>
        )}
      </div>
    </button>
  );
}

export function RoomsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: rooms, isLoading, isError } = useRooms();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  function openRoom(id: string) {
    navigate(`/rooms/${id}`);
  }

  return (
    <div className="h-full overflow-y-auto bg-neutral-50">
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-neutral-900 mb-3">{t('rooms.title')}</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreate(true)}
              className="flex-1 flex items-center justify-center gap-2 bg-brand-gradient hover:bg-brand-gradient-hover text-white font-semibold py-2.5 rounded-xl transition"
            >
              <Plus size={16} />
              {t('common.create')}
            </button>
            <button
              onClick={() => setShowJoin(true)}
              className="flex-1 flex items-center justify-center gap-2 bg-white text-neutral-700 border border-neutral-200 font-semibold py-2.5 rounded-xl hover:bg-neutral-50 transition"
            >
              <LogIn size={16} />
              {t('rooms.join')}
            </button>
          </div>
        </div>

        {isLoading && <p className="text-neutral-400 animate-pulse">{t('common.loading')}</p>}

        {isError && (
          <p className="text-danger-700 bg-danger-100 rounded-lg px-4 py-3">{t('common.error')}</p>
        )}

        {rooms && rooms.length === 0 && (
          <div className="bg-white rounded-card shadow-card p-10 text-center">
            <p className="text-lg text-neutral-900 mb-1">{t('rooms.empty')} 🏕️</p>
            <p className="text-neutral-600 text-sm mb-5">{t('rooms.emptyHint')}</p>
            <button
              onClick={() => setShowCreate(true)}
              className="bg-brand-gradient hover:bg-brand-gradient-hover text-white font-semibold px-5 py-2.5 rounded-xl transition"
            >
              {t('rooms.createNew')}
            </button>
          </div>
        )}

        {rooms && rooms.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-4">
            {rooms.map((room) => (
              <RoomCard key={room.id} room={room} onOpen={openRoom} />
            ))}
          </div>
        )}
      </main>

      {showCreate && (
        <CreateRoomModal
          onClose={() => setShowCreate(false)}
          onCreated={(id) => {
            setShowCreate(false);
            openRoom(id);
          }}
        />
      )}

      {showJoin && (
        <JoinRoomModal
          onClose={() => setShowJoin(false)}
          onJoined={(id) => {
            setShowJoin(false);
            openRoom(id);
          }}
        />
      )}
    </div>
  );
}
