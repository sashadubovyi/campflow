import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Users, Info, ChevronDown, ChevronUp, X, Trash2, Pencil, Star } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useRoom } from '../../shared/api/rooms.hooks';
import { useAuth } from '../../shared/store/useAuth';
import { useMediaQuery } from '../../shared/lib/useMediaQuery';
import { MembersPanel } from './MembersPanel';
import { ChatPanel } from './ChatPanel';
import { PollsPanel } from './PollsPanel';
import { InviteButton } from './InviteButton';
import { CloseRoomModal } from './CloseRoomModal';
import { EditRoomModal } from './EditRoomModal';
import { usePresence } from '../../shared/api/usePresence';
import { useArchiveRoom } from '../../shared/api/rooms.hooks';
import { BackButton, Modal } from '../../shared/ui';
import { getMediaUrl } from '../../shared/lib/getMediaUrl';

export function RoomPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: room, isLoading, isError } = useRoom(id ?? '');
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [mobileView, setMobileView] = useState<'chat' | 'members' | 'info'>('chat');
  const [infoOpen, setInfoOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');
  usePresence(id ?? '');
  const [showMembers, setShowMembers] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [importantOnly, setImportantOnly] = useState(false);
  const [hasImportant, setHasImportant] = useState(false);
  const archiveRoom = useArchiveRoom();

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
  const chat = (
    <ChatPanel
      roomId={room.id}
      roomName={room.name}
      importantOnly={importantOnly}
      onHasImportantChange={setHasImportant}
    />
  );

  const importantStar = hasImportant && (
    <button
      onClick={() => setImportantOnly((v) => !v)}
      title={t('chat.importantFilter', 'Тільки важливі')}
      className={`flex items-center justify-center w-9 h-9 rounded-xl transition ${
        importantOnly
          ? 'bg-amber-50 text-amber-500'
          : 'text-neutral-400 hover:bg-neutral-100 hover:text-amber-500'
      }`}
    >
      <Star size={16} className={importantOnly ? 'fill-amber-400' : ''} />
    </button>
  );

  const closeBtn = isAdmin && !isClosed && (
    <button
      onClick={() => { setInfoOpen(false); setShowCloseModal(true); }}
      title={t('polls.ai.closeRoom')}
      aria-label={t('polls.ai.closeRoom')}
      className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl transition bg-danger-gradient text-white text-sm font-semibold whitespace-nowrap"
    >
      <X size={16} />
      <span className="text-xs font-semibold">{t('polls.ai.closeRoom')}</span>
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
        {/* Хедер — h1 абсолютно позиціонований щоб не зсувався від кнопок */}
        <header className="relative bg-white border-b border-neutral-100 shrink-0 px-4 h-14 flex items-center">
          <div className="flex items-center justify-start min-w-[2.5rem] shrink-0">
            <BackButton />
          </div>
          {/* Title: absolute center, pointer-events-none щоб не блокувати кнопки */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-24 gap-2">
            {room.coverUrl && (
              <img
                src={getMediaUrl(room.coverUrl)}
                alt=""
                className="w-7 h-7 rounded-md object-cover shrink-0"
              />
            )}
            <h1 className="font-display text-lg font-bold text-neutral-900 truncate">
              {room.name}
            </h1>
          </div>
          <div className="flex items-center justify-end gap-1.5 shrink-0 ml-auto">
            {importantStar}
            {isAdmin && !isClosed && (
              <button
                onClick={() => setShowEditModal(true)}
                title={t('rooms.editRoom')}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition text-xs font-semibold"
              >
                <Pencil size={14} />
                {t('rooms.editRoom')}
              </button>
            )}
            <InviteButton roomId={room.id} inviteCode={room.inviteCode} />
            {closeBtn}
            {isAdmin && isClosed && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={archiveRoom.isPending}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl transition bg-red-50 text-red-500 hover:bg-red-100 text-xs font-semibold disabled:opacity-50 whitespace-nowrap"
              >
                <Trash2 size={14} />
                {t('rooms.delete')}
              </button>
            )}
          </div>
        </header>

        {/* Основний вміст — resizable panels */}
        <PanelGroup
          direction="horizontal"
          autoSaveId="room-h"
          style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}
        >
          {/* Чат */}
          <Panel defaultSize={78} minSize={50} style={{ minHeight: 0, overflow: 'hidden' }}>
            {chat}
          </Panel>

          {/* Вертикальний resizer */}
          <PanelResizeHandle style={{ width: 4, background: '#f0f0f0', cursor: 'col-resize', transition: 'background 0.15s' }}
            onDragging={(isDragging) => {
              const el = document.querySelector('[data-panel-resize-handle-id]') as HTMLElement;
              if (el) el.style.background = isDragging ? '#2d6ff8' : '#f0f0f0';
            }}
          />

          {/* Права панель */}
          <Panel defaultSize={22} minSize={15} maxSize={45} style={{ minHeight: 0, overflow: 'hidden', borderLeft: '1px solid #f0f2f5' }}>
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

              {/* Polls + Members (resizable vertically) */}
              <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                {showMembers ? (
                  <PanelGroup direction="vertical" autoSaveId="room-v" style={{ height: '100%' }}>
                    <Panel defaultSize={50} minSize={20} style={{ minHeight: 0, overflow: 'hidden' }}>
                      {polls}
                    </Panel>
                    <PanelResizeHandle style={{ height: 4, background: '#f0f0f0', cursor: 'row-resize', transition: 'background 0.15s' }} />
                    <Panel defaultSize={50} minSize={20} style={{ minHeight: 0, overflow: 'hidden' }}>
                      {members}
                    </Panel>
                  </PanelGroup>
                ) : (
                  <div style={{ height: '100%', overflow: 'hidden' }}>{polls}</div>
                )}
              </div>

              {/* Toggle members кнопка */}
              <button
                onClick={() => setShowMembers((v) => !v)}
                className="shrink-0 border-t border-neutral-100 py-3.5 text-sm font-semibold text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700 transition flex items-center justify-center gap-1.5"
              >
                <Users size={14} />
                {t('rooms.members')}
                {showMembers ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
              </button>
            </div>
          </Panel>
        </PanelGroup>

        {modal}
        {showEditModal && (
          <EditRoomModal room={room} onClose={() => setShowEditModal(false)} />
        )}
        <Modal
          open={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          size="sm"
        >
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-neutral-900 mb-1">
                {t('rooms.delete')}
              </h3>
              <p className="text-sm text-neutral-500">
                {t('rooms.deleteConfirmText', { name: room.name })}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 border border-neutral-100 text-neutral-700 font-semibold py-2.5 rounded-xl hover:bg-neutral-50 transition text-sm"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={async () => {
                  await archiveRoom.mutateAsync(room.id);
                  navigate('/rooms');
                }}
                disabled={archiveRoom.isPending}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl transition text-sm disabled:opacity-50"
              >
                {archiveRoom.isPending ? '...' : t('rooms.confirmDelete')}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  /* ---------- MOBILE ---------- */
  return (
    <div className="h-full flex flex-col bg-neutral-50 overflow-hidden">
      <header className="relative bg-white border-b border-neutral-100 shrink-0 px-2 h-14 flex items-center gap-1">
        <button
          onClick={() => (mobileView !== 'chat' ? setMobileView('chat') : navigate('/rooms'))}
          className="p-2 text-neutral-500 hover:text-neutral-900 rounded-lg shrink-0"
        >
          <ChevronLeft size={20} />
        </button>
        {/* Абсолютно позиціонований заголовок — не зсувається від кнопок */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-20 gap-2">
          {room.coverUrl && (
            <img
              src={getMediaUrl(room.coverUrl)}
              alt=""
              className="w-7 h-7 rounded-md object-cover shrink-0"
            />
          )}
          <h1 className="font-display text-lg font-bold text-neutral-900 truncate">
            {room.name}
          </h1>
        </div>
        <div className="ml-auto flex items-center gap-0.5 shrink-0">
          {importantStar}
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
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-hidden relative">
        {chat}
        <div
          onClick={() => setMobileView('chat')}
          className={`absolute inset-0 bg-neutral-900/40 z-10 transition-opacity duration-300 ${
            mobileView !== 'chat' ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          
        />
        <div
          className={`absolute top-2 right-0 bottom-0 z-20 w-[85vw] bg-white shadow-card-lg flex flex-col transition-transform duration-300 ease-out overflow-hidden ${
            mobileView === 'members' ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{ borderTopLeftRadius: '14px' }}
        >
          {members}
        </div>
        <div
          className={`absolute top-2 right-0 bottom-0 z-20 w-[85vw] bg-white shadow-card-lg flex flex-col transition-transform duration-300 ease-out overflow-hidden ${
            mobileView === 'info' ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{ borderTopLeftRadius: '14px' }}
        >
          <div className="border-b border-neutral-100 shrink-0">
            <div className="px-4 pt-3 pb-2 flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-bold text-neutral-900 truncate">{room.name}</h2>
                {room.description && (
                  <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{room.description}</p>
                )}
              </div>
              <button
                onClick={() => setMobileView('chat')}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg shrink-0"
              >
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1 bg-neutral-100 mx-2 mb-2 p-1 rounded-xl">
              <InviteButton
                roomId={room.id}
                inviteCode={room.inviteCode}
                iconOnly
              />
              {isAdmin && !isClosed && (
                <button
                  onClick={() => { setMobileView('chat'); setShowEditModal(true); }}
                  className="flex items-center justify-center py-2 rounded-xl text-neutral-500 hover:bg-white transition"
                  title={t('rooms.editRoom')}
                  aria-label={t('rooms.editRoom')}
                >
                  <Pencil size={16} />
                </button>
              )}
              {isAdmin && !isClosed && (
                <button
                  onClick={() => { setInfoOpen(false); setShowCloseModal(true); }}
                  title={t('polls.ai.closeRoom')}
                  aria-label={t('polls.ai.closeRoom')}
                  className="flex items-center justify-center py-2 rounded-xl bg-danger-gradient text-white transition"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            {isAdmin && isClosed && (
              <div className="px-2 pb-2">
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50 transition whitespace-nowrap"
                  >
                    <Trash2 size={13} />
                    {t('rooms.delete')}
                  </button>
                ) : (
                  <div className="flex gap-1">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-neutral-500 hover:bg-neutral-100 transition"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      onClick={async () => {
                        await archiveRoom.mutateAsync(room.id);
                        navigate('/rooms');
                      }}
                      disabled={archiveRoom.isPending}
                      className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-red-500 text-white hover:bg-red-600 transition disabled:opacity-50"
                    >
                      {t('rooms.confirmDelete')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">{polls}</div>
        </div>
      </div>

      {modal}
      {showEditModal && (
        <EditRoomModal room={room} onClose={() => setShowEditModal(false)} />
      )}
    </div>
  );
}
