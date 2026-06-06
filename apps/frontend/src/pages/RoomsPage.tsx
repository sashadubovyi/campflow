import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, X } from 'lucide-react';
import { useRooms } from '../shared/api/rooms.hooks';
import { RoomsHeader } from './rooms/RoomsHeader';
import { RoomsEmpty } from './rooms/RoomsEmpty';
import { RoomsList } from './rooms/RoomsList';
import { CreateRoomModal } from './rooms/CreateRoomModal';
import { JoinRoomModal } from './rooms/JoinRoomModal';

export function RoomsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: rooms, isLoading, isError } = useRooms();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  function openRoom(id: string) {
    navigate(`/rooms/${id}`);
  }

  const filtered = rooms
    ? query.trim()
      ? rooms.filter((r) => r.name.toLowerCase().includes(query.toLowerCase()))
      : rooms
    : [];

  return (
    <div className="h-full flex flex-col bg-neutral-50 overflow-hidden">
      <RoomsHeader
        onCreateClick={() => setShowCreate(true)}
        onJoinClick={() => setShowJoin(true)}
        onSearchClick={() => {
          setSearchOpen((v) => !v);
          setQuery('');
        }}
        searchOpen={searchOpen}
      />

      {/* Поле пошуку */}
      {searchOpen && (
        <div className="bg-white border-b border-neutral-100 px-4 md:px-6 py-2 flex items-center gap-2">
          <Search size={16} className="text-neutral-400 shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('rooms.searchPlaceholder')}
            className="flex-1 text-sm outline-none bg-transparent text-neutral-900 placeholder:text-neutral-400"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-neutral-400 hover:text-neutral-600">
              <X size={15} />
            </button>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <main className="px-4 md:px-6 py-6">
          {isLoading && (
            <p className="text-neutral-400 animate-pulse text-center">{t('common.loading')}</p>
          )}
          {isError && (
            <p className="text-danger-700 bg-danger-100 rounded-lg px-4 py-3 text-center">
              {t('common.error')}
            </p>
          )}
          {!isLoading && !isError && filtered.length === 0 && query && (
            <p className="text-neutral-400 text-center text-sm py-10">
              {t('rooms.searchEmpty', { query })}
            </p>
          )}
          {!isLoading && !isError && filtered.length === 0 && !query && (
            <RoomsEmpty onCreateClick={() => setShowCreate(true)} />
          )}
          {filtered.length > 0 && <RoomsList rooms={filtered} onOpen={openRoom} />}
        </main>
      </div>

      {showCreate && (
        <CreateRoomModal
          onClose={() => setShowCreate(false)}
          onCreated={(id) => { setShowCreate(false); openRoom(id); }}
        />
      )}
      {showJoin && (
        <JoinRoomModal
          onClose={() => setShowJoin(false)}
          onJoined={(id) => { setShowJoin(false); openRoom(id); }}
        />
      )}
    </div>
  );
}
