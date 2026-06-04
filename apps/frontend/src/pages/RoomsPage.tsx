import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

  function openRoom(id: string) {
    navigate(`/rooms/${id}`);
  }

  return (
    <div className="h-full flex flex-col bg-neutral-50 overflow-hidden">
      <RoomsHeader
        onCreateClick={() => setShowCreate(true)}
        onJoinClick={() => setShowJoin(true)}
      />

      <div className="flex-1 overflow-y-auto">
        <main className="max-w-4xl mx-auto px-6 py-6">
          {isLoading && (
            <p className="text-neutral-400 animate-pulse text-center">{t('common.loading')}</p>
          )}
          {isError && (
            <p className="text-danger-700 bg-danger-100 rounded-lg px-4 py-3 text-center">
              {t('common.error')}
            </p>
          )}
          {rooms && rooms.length === 0 && <RoomsEmpty onCreateClick={() => setShowCreate(true)} />}
          {rooms && rooms.length > 0 && <RoomsList rooms={rooms} onOpen={openRoom} />}
        </main>
      </div>

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
