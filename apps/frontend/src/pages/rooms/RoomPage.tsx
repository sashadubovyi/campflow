import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Users, Info, ChevronDown, ChevronUp } from 'lucide-react';
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
import { BackButton } from '../../shared/ui';

export function RoomPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: room, isLoading, isError } = useRoom(id ?? '');
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [mobileView, setMobileView] = useState<'chat' | 'members' | 'info'>('chat');
  const [infoOpen, setInfoOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');
  usePresence(id ?? '');
  const [showMembers, setShowMembers] = useState(false);

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
      className="w-full text-xs font-semibold py-1.5 rounded-lg transition bg-danger-gradient text-white"
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
            <BackButton />
            <h1 className="text-lg font-bold text-neutral-900 truncate">{room.name}</h1>
          </div>
          <div className="flex items-center gap-3">
            <InviteButton roomId={room.id} inviteCode={room.inviteCode} />
            {closeBtn}
          </div>
        </header>
        <div className="flex-1 grid grid-cols-[1fr_22%] min-h-0 overflow-hidden">
          <div className="min-h-0 overflow-hidden">{chat}</div>
          <div className="border-l border-neutral-100 min-h-0 overflow-hidden flex flex-col">
            <div className={`min-h-0 overflow-hidden ${showMembers ? 'h-1/2' : 'flex-1'}`}>
              {polls}
            </div>
            {showMembers && (
              <div className="h-1/2 border-t border-neutral-100 min-h-0 overflow-hidden">
                {members}
              </div>
            )}
            <button
              onClick={() => setShowMembers((v) => !v)}
              className="shrink-0 border-t border-neutral-100 py-3.5 text-sm font-semibold text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700 transition flex items-center justify-center gap-1.5"
            >
              <Users size={14} />
              {t('rooms.members')}
              {showMembers ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
            </button>
          </div>
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
          onClick={() => (mobileView !== 'chat' ? setMobileView('chat') : navigate('/rooms'))}
          className="p-2 text-neutral-500 hover:text-neutral-900 rounded-lg"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="flex-1 text-base font-bold text-neutral-900 truncate text-center px-1">
          {room.name}
        </h1>
        <button
          onClick={() => setMobileView((v) => (v === 'members' ? 'chat' : 'members'))}
          className={`p-2 rounded-lg transition ${mobileView === 'members' ? 'text-accent-600 bg-accent-50' : 'text-neutral-500 hover:text-accent-600'}`}
        >
          <Users size={20} />
        </button>
        <button
          onClick={() => setMobileView((v) => (v === 'info' ? 'chat' : 'info'))}
          className={`p-2 rounded-lg transition ${mobileView === 'info' ? 'text-accent-600 bg-accent-50' : 'text-neutral-500 hover:text-accent-600'}`}
        >
          <Info size={20} />
        </button>
      </header>

      <div className="flex-1 min-h-0 overflow-hidden relative">
        {/* Чат — завжди рендериться позаду */}
        {chat}

        {/* Затемнення */}
        <div
          onClick={() => setMobileView('chat')}
          className={`absolute inset-0 bg-neutral-900/40 z-10 transition-opacity duration-300 ${
            mobileView !== 'chat' ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        />

        {/* Учасники */}
        <div
          className={`absolute top-0 right-0 bottom-0 z-20 w-[60vw] bg-white shadow-card-lg flex flex-col transition-transform duration-300 ease-out ${
            mobileView === 'members' ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {members}
        </div>

        {/* Інфо + опитування */}
        <div
          className={`absolute top-0 right-0 bottom-0 z-20 w-[60vw] bg-white shadow-card-lg flex flex-col transition-transform duration-300 ease-out ${
            mobileView === 'info' ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="border-b border-neutral-100 shrink-0">
            <div className="px-4 pt-4 pb-3">
              <h2 className="text-lg font-bold text-neutral-900">{room.name}</h2>
              {room.description && (
                <p className="text-sm text-neutral-600 mt-1">{room.description}</p>
              )}
            </div>
            <div className="flex gap-1 bg-neutral-100 mx-2 mb-2 p-1 rounded-xl">
              <div className="flex-1">
                <InviteButton roomId={room.id} inviteCode={room.inviteCode} />
              </div>
              {closeBtn && <div className="flex-1">{closeBtn}</div>}
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">{polls}</div>
        </div>
      </div>

      {modal}
    </div>
  );
}
