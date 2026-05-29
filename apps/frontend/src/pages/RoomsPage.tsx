import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../shared/store/useAuth';
import { useRooms } from '../shared/api/rooms.hooks';
import type { RoomListItem } from '../shared/api/rooms.api';
import { CreateRoomModal } from './rooms/CreateRoomModal';
import { JoinRoomModal } from './rooms/JoinRoomModal';

function formatDateRange(startsAt: string | null, endsAt: string | null): string | null {
  if (!startsAt) return null;
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });
  return endsAt ? `${fmt(startsAt)} — ${fmt(endsAt)}` : fmt(startsAt);
}

function RoomCard({ room, onOpen }: { room: RoomListItem; onOpen: (id: string) => void }) {
  const dates = formatDateRange(room.startsAt, room.endsAt);
  return (
    <button
      onClick={() => onOpen(room.id)}
      className="text-left bg-white rounded-2xl border border-forest-100 shadow-sm hover:shadow-md hover:border-forest-500/30 transition p-5 group"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-lg font-semibold text-forest-900 group-hover:text-forest-600 transition">
          {room.name}
        </h3>
        <span className="shrink-0 text-xs bg-forest-50 text-forest-600 rounded-full px-2.5 py-1 font-medium">
          {room.memberCount} 👤
        </span>
      </div>
      {room.description && (
        <p className="text-sm text-forest-700 mt-2 line-clamp-2">{room.description}</p>
      )}
      {dates && <p className="text-xs text-forest-500 mt-3">📅 {dates}</p>}
    </button>
  );
}

export function RoomsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { data: rooms, isLoading, isError } = useRooms();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  function openRoom(id: string) {
    navigate(`/rooms/${id}`);
  }

  return (
    <div className="min-h-screen bg-forest-50 font-body">
      {/* Хедер */}
      <header className="bg-white border-b border-forest-100">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-forest-900">
            Camp<span className="text-ember-500">Flow</span>
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/contacts')}
              className="text-sm text-forest-600 hover:text-forest-900 font-medium"
            >
              📒 Контакти
            </button>
            <span className="text-forest-700 text-sm">{user?.fullName}</span>
            <button
              onClick={logout}
              className="text-sm text-forest-600 hover:text-forest-900 font-medium"
            >
              Вийти
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-bold text-forest-900">Мої кімнати</h2>
          <div className="flex gap-3">
            <button
              onClick={() => setShowJoin(true)}
              className="text-sm border border-forest-100 text-forest-700 font-semibold px-4 py-2 rounded-xl hover:bg-white transition"
            >
              Приєднатися
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="text-sm bg-forest-600 hover:bg-forest-700 text-white font-semibold px-4 py-2 rounded-xl transition"
            >
              + Створити
            </button>
          </div>
        </div>

        {isLoading && <p className="text-forest-500 animate-pulse">Завантаження кімнат…</p>}

        {isError && (
          <p className="text-red-500 bg-red-50 rounded-lg px-4 py-3">
            Не вдалося завантажити кімнати
          </p>
        )}

        {rooms && rooms.length === 0 && (
          <div className="bg-white rounded-2xl border border-forest-100 border-dashed p-10 text-center">
            <p className="font-display text-lg text-forest-900 mb-1">Поки що порожньо 🏕️</p>
            <p className="text-forest-700 text-sm mb-5">
              Створіть першу кімнату або приєднайтесь за кодом запрошення.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="bg-forest-600 hover:bg-forest-700 text-white font-semibold px-5 py-2.5 rounded-xl transition"
            >
              + Створити кімнату
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
