import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Users, Info } from 'lucide-react';
import { useRoom } from '../../shared/api/rooms.hooks';
import { useAuth } from '../../shared/store/useAuth';
import { useMediaQuery } from '../../shared/lib/useMediaQuery';
import { Drawer } from '../../shared/ui';
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
  const [membersOpen, setMembersOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');
  usePresence(id ?? '');

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-neutral-400 animate-pulse">
        {t('common.loading')}
      </div>
    );
  }

  if (isError || !room) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-neutral-600">{t('rooms.empty')}</p>
        <button
          onClick={() => navigate('/rooms')}
          className="bg-brand-gradient hover:bg-brand-gradient-hover text-white font-semibold px-5 py-2.5 rounded-xl transition"
        >
          {t('common.back')}
        </button>
      </div>
    );
  }

  const isAdmin = room.currentUserRole === 'admin';
  const isClosed = room.status === 'closed';

  const members = (
    <MembersPanel
      roomId={room.id}
      members={room.members}
      currentUserId={user?.id ?? ''}
      isAdmin={isAdmin}
    />
  );
  const polls = (
    <PollsPanel
      roomId={room.id}
      isAdmin={isAdmin}
      members={room.members}
      currentUserId={user?.id ?? ''}
    />
  );
  const chat = <ChatPanel roomId={room.id} roomName={room.name} />;

  const closeBtn = isAdmin && !isClosed && (
    <button
      onClick={() => {
        setInfoOpen(false);
        setShowCloseModal(true);
      }}
      className="bg-danger-gradient hover:bg-danger-gradient-hover text-white text-sm font-medium px-3 py-1.5 rounded-lg transition shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]"
    >
      {t('polls.ai.closeRoom')}
    </button>
  );

  const modal = showCloseModal && (
    <CloseRoomModal
      roomId={room.id}
      roomName={room.name}
      onClose={() => setShowCloseModal(false)}
      onClosed={() => navigate('/rooms')}
    />
  );

  /* ---------- DESKTOP ---------- */
  if (isDesktop) {
    return (
      <div className="h-full flex flex-col bg-neutral-50 overflow-hidden">
        <header className="bg-white border-b border-neutral-100 shrink-0 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate('/rooms')}
              className="text-neutral-500 hover:text-neutral-900 text-sm font-medium"
            >
              {t('common.back')}
            </button>
            <h1 className="text-lg font-bold text-neutral-900 truncate">{room.name}</h1>
          </div>
          <div className="flex items-center gap-3">
            <InviteButton roomId={room.id} inviteCode={room.inviteCode} />
            {closeBtn}
          </div>
        </header>
        <div className="flex-1 grid grid-cols-[22%_56%_22%] min-h-0 overflow-hidden">
          <div className="border-r border-neutral-100 min-h-0 overflow-hidden">{members}</div>
          <div className="min-h-0 overflow-hidden">{chat}</div>
          <div className="border-l border-neutral-100 min-h-0 overflow-hidden">{polls}</div>
        </div>
        {modal}
      </div>
    );
  }

  /* ---------- MOBILE ---------- */
  return (
    <div className="h-full flex flex-col bg-neutral-50 overflow-hidden">
      <header className="bg-white border-b border-neutral-100 shrink-0 px-2 py-2 flex items-center gap-1">
        <button
          onClick={() => navigate('/rooms')}
          className="p-2 text-neutral-500 hover:text-neutral-900 rounded-lg"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="flex-1 text-base font-bold text-neutral-900 truncate text-center px-1">
          {room.name}
        </h1>
        <button
          onClick={() => setMembersOpen(true)}
          className="p-2 text-neutral-500 hover:text-accent-600 rounded-lg"
          title={t('rooms.members')}
        >
          <Users size={20} />
        </button>
        <button
          onClick={() => setInfoOpen(true)}
          className="p-2 text-neutral-500 hover:text-accent-600 rounded-lg"
          title={t('rooms.info')}
        >
          <Info size={20} />
        </button>
      </header>

      <div className="flex-1 min-h-0 overflow-hidden">{chat}</div>

      {/* Учасники — шторка зліва */}
      <Drawer open={membersOpen} onClose={() => setMembersOpen(false)} side="left">
        {members}
      </Drawer>

      {/* Інфо кімнати + опитування — шторка справа */}
      <Drawer open={infoOpen} onClose={() => setInfoOpen(false)} side="right">
        <div className="flex flex-col h-full min-h-0">
          <div className="p-4 border-b border-neutral-100 shrink-0">
            <h2 className="text-lg font-bold text-neutral-900">{room.name}</h2>
            {room.description && (
              <p className="text-sm text-neutral-600 mt-1">{room.description}</p>
            )}
            <div className="mt-3 flex flex-col gap-2">
              <InviteButton roomId={room.id} inviteCode={room.inviteCode} />
              {closeBtn}
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">{polls}</div>
        </div>
      </Drawer>

      {modal}
    </div>
  );
}
