import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useRoom } from '../../shared/api/rooms.hooks';
import { useAuth } from '../../shared/store/useAuth';
import { MembersPanel } from './MembersPanel';
import { ChatPanel } from './ChatPanel';
import { PollsPanel } from './PollsPanel';
import { InviteButton } from './InviteButton';
import { CloseRoomModal } from './CloseRoomModal';
import { usePresence } from '../../shared/api/usePresence';

export function RoomPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: room, isLoading, isError } = useRoom(id ?? '');
  const [showCloseModal, setShowCloseModal] = useState(false);
  usePresence(id ?? '');

  if (isLoading) {
    return (
      <div className="h-screen bg-forest-50 flex items-center justify-center">
        <p className="font-display text-xl text-forest-900 animate-pulse">{t('common.loading')}</p>
      </div>
    );
  }

  if (isError || !room) {
    return (
      <div className="h-screen bg-forest-50 flex flex-col items-center justify-center gap-4 px-6">
        <p className="font-body text-forest-700">{t('rooms.empty')}</p>
        <button
          onClick={() => navigate('/rooms')}
          className="bg-forest-600 hover:bg-forest-700 text-white font-semibold px-5 py-2.5 rounded-xl transition"
        >
          {t('common.back')}
        </button>
      </div>
    );
  }

  const isAdmin = room.currentUserRole === 'admin';
  const isClosed = room.status === 'closed';

  return (
    <div className="h-[100dvh] flex flex-col bg-forest-50 overflow-hidden">
      <header className="bg-white border-b border-forest-100 shrink-0">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/rooms')}
              className="text-forest-600 hover:text-forest-900 font-body text-sm font-medium"
            >
              {t('common.back')}
            </button>
            <span className="font-display text-lg font-bold text-forest-900">
              Camp<span className="text-ember-500">Flow</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <InviteButton roomId={room.id} inviteCode={room.inviteCode} />
            {isAdmin && !isClosed && (
              <button
                onClick={() => setShowCloseModal(true)}
                className="border border-ember-500 text-ember-500 hover:bg-ember-500 hover:text-white font-body text-sm font-medium px-3 py-1.5 rounded-lg transition"
              >
                {t('polls.ai.closeRoom')}
              </button>
            )}
            <span className="font-body text-sm text-forest-700">{user?.fullName}</span>
          </div>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-[20%_60%_20%] min-h-0 overflow-hidden">
        <MembersPanel
          roomId={room.id}
          members={room.members}
          currentUserId={user?.id ?? ''}
          isAdmin={isAdmin}
        />
        <ChatPanel roomId={room.id} roomName={room.name} />
        <PollsPanel
          roomId={room.id}
          isAdmin={isAdmin}
          members={room.members}
          currentUserId={user?.id ?? ''}
        />
      </div>

      {showCloseModal && (
        <CloseRoomModal
          roomId={room.id}
          roomName={room.name}
          onClose={() => setShowCloseModal(false)}
          onClosed={() => navigate('/rooms')}
        />
      )}
    </div>
  );
}
