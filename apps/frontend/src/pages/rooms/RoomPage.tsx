import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Users, Info, ChevronDown, ChevronUp, X, Trash2, Pencil, Star } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
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
import { Skeleton } from '../../shared/ui/Skeleton';
import { getMediaUrl } from '../../shared/lib/getMediaUrl';

function RoomPageSkeleton() {
  return (
    <div className="h-full flex flex-col">
      <div className="glass-header h-12 shrink-0 px-4 flex items-center gap-3">
        <Skeleton className="w-8 h-8 rounded-xl" />
        <div className="flex-1 flex justify-center">
          <Skeleton className="h-5 w-40" />
        </div>
        <Skeleton className="w-8 h-8 rounded-xl" />
      </div>
      <div className="flex-1 px-4 py-4 space-y-3 overflow-hidden">
        <div className="flex gap-2.5 items-end">
          <Skeleton className="w-8 h-8 rounded-full shrink-0" />
          <Skeleton className="h-10 rounded-2xl w-3/5" />
        </div>
        <div className="flex gap-2.5 items-end">
          <Skeleton className="w-8 h-8 rounded-full shrink-0" />
          <Skeleton className="h-14 rounded-2xl w-1/2" />
        </div>
        <div className="flex gap-2.5 items-end flex-row-reverse">
          <Skeleton className="h-10 rounded-2xl w-2/5" />
        </div>
        <div className="flex gap-2.5 items-end">
          <Skeleton className="w-8 h-8 rounded-full shrink-0" />
          <Skeleton className="h-10 rounded-2xl w-3/4" />
        </div>
        <div className="flex gap-2.5 items-end flex-row-reverse">
          <Skeleton className="h-12 rounded-2xl w-1/2" />
        </div>
        <div className="flex gap-2.5 items-end">
          <Skeleton className="w-8 h-8 rounded-full shrink-0" />
          <Skeleton className="h-10 rounded-2xl w-2/3" />
        </div>
      </div>
      <div className="border-t border-white/30 bg-white/55 backdrop-blur-xl px-4 py-3 flex items-center gap-2 shrink-0">
        <Skeleton className="flex-1 h-11 rounded-2xl" />
        <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
      </div>
    </div>
  );
}

export function RoomPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: room, isLoading, isError } = useRoom(id ?? '');
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');
  usePresence(id ?? '');
  const [showMembers, setShowMembers] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [importantOnly, setImportantOnly] = useState(false);
  const [hasImportant, setHasImportant] = useState(false);
  const archiveRoom = useArchiveRoom();

  if (isLoading) return <RoomPageSkeleton />;

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
      members={room.members}
      importantOnly={importantOnly}
      onHasImportantChange={setHasImportant}
    />
  );

  const importantStar = hasImportant && (
    <button
      onClick={() => setImportantOnly((v) => !v)}
      title={t('chat.importantFilter', 'Тільки важливі')}
      className={`flex items-center justify-center w-9 h-9 rounded-xl transition ${
        importantOnly ? 'bg-amber-50 text-amber-500' : 'glass-icon'
      }`}
    >
      <Star size={16} className={importantOnly ? 'fill-amber-400' : ''} />
    </button>
  );

  const closeBtn = isAdmin && !isClosed && (
    <button
      onClick={() => setShowCloseModal(true)}
      title={t('polls.ai.closeRoom')}
      aria-label={t('polls.ai.closeRoom')}
      className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl transition bg-danger-gradient text-white text-sm font-semibold whitespace-nowrap"
    >
      <X size={16} />
      <span className="text-xs font-semibold">{t('polls.ai.closeRoom')}</span>
    </button>
  );

  const modal = (
    <AnimatePresence>
      {showCloseModal && (
        <CloseRoomModal
          roomId={room.id}
          roomName={room.name}
          onClose={() => setShowCloseModal(false)}
          onClosed={() => navigate('/rooms')}
        />
      )}
    </AnimatePresence>
  );

  // Info modal meta: room name, description, admin actions
  const infoMeta = (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        {room.coverUrl && (
          <img
            src={getMediaUrl(room.coverUrl)}
            alt=""
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            className="w-12 h-12 rounded-xl object-cover shrink-0"
          />
        )}
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-bold text-neutral-900 leading-tight">
            {room.name}
          </h2>
          {room.description && (
            <p className="text-sm text-neutral-500 mt-1 leading-relaxed">{room.description}</p>
          )}
        </div>
      </div>

      {isAdmin && !isClosed && (
        <div className="grid grid-cols-3 gap-2">
          <InviteButton roomId={room.id} inviteCode={room.inviteCode} iconOnly />
          <button
            onClick={() => { setInfoOpen(false); setShowEditModal(true); }}
            className="flex items-center justify-center py-2.5 rounded-xl glass-icon transition"
            title={t('rooms.editRoom')}
            aria-label={t('rooms.editRoom')}
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => { setInfoOpen(false); setShowCloseModal(true); }}
            className="flex items-center justify-center py-2.5 rounded-xl bg-danger-gradient text-white transition"
            title={t('polls.ai.closeRoom')}
            aria-label={t('polls.ai.closeRoom')}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {!isAdmin && (
        <InviteButton roomId={room.id} inviteCode={room.inviteCode} />
      )}

      {isAdmin && isClosed && (
        <div className="space-y-2">
          <InviteButton roomId={room.id} inviteCode={room.inviteCode} />
          <button
            onClick={() => { setInfoOpen(false); setShowDeleteConfirm(true); }}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 border border-red-100 transition"
          >
            <Trash2 size={15} />
            {t('rooms.delete')}
          </button>
        </div>
      )}
    </div>
  );

  const deleteConfirmModal = (
    <Modal open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} size="sm">
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
            className="flex-1 glass-btn py-2.5 text-sm"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={() => {
              archiveRoom.mutate(room.id, { onSuccess: () => navigate('/rooms') });
            }}
            disabled={archiveRoom.isPending}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl transition text-sm disabled:opacity-50"
          >
            {archiveRoom.isPending ? '...' : t('rooms.confirmDelete')}
          </button>
        </div>
      </div>
    </Modal>
  );

  /* ---------- DESKTOP ---------- */
  if (isDesktop) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <header className="glass-header shadow-[0_0.5px_0_rgba(0,0,0,0.06)] shrink-0 px-4 h-12 grid grid-cols-[auto_1fr_auto] items-center gap-2">
          <div className="flex items-center min-w-[2.5rem]">
            <BackButton />
          </div>
          {/* Clickable title: info icon + room name */}
          <div className="flex items-center justify-center min-w-0">
            <button
              onClick={() => setInfoOpen(true)}
              className="flex items-center gap-1.5 hover:bg-white/50 px-2.5 py-1.5 rounded-xl transition min-w-0 max-w-full"
            >
              <Info size={15} className="text-neutral-400 shrink-0" />
              {room.coverUrl && (
                <img
                  src={getMediaUrl(room.coverUrl)}
                  alt=""
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  className="w-6 h-6 rounded-md object-cover shrink-0"
                />
              )}
              <h1 className="font-display text-lg font-bold text-neutral-900 truncate">
                {room.name}
              </h1>
            </button>
          </div>
          <div className="flex items-center justify-end gap-1.5">
            {importantStar}
            {isAdmin && !isClosed && (
              <button
                onClick={() => setShowEditModal(true)}
                title={t('rooms.editRoom')}
                className="flex items-center justify-center gap-1.5 px-3 py-2 glass-icon text-xs font-semibold"
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

        <PanelGroup
          direction="horizontal"
          autoSaveId="room-h"
          style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}
        >
          <Panel defaultSize={78} minSize={50} style={{ minHeight: 0, overflow: 'hidden' }}>
            {chat}
          </Panel>
          <PanelResizeHandle
            style={{ width: 4, background: '#f0f0f0', cursor: 'col-resize', transition: 'background 0.15s' }}
            onDragging={(isDragging) => {
              const el = document.querySelector('[data-panel-resize-handle-id]') as HTMLElement;
              if (el) el.style.background = isDragging ? '#2d6ff8' : '#f0f0f0';
            }}
          />
          <Panel defaultSize={22} minSize={15} maxSize={45} style={{ minHeight: 0, overflow: 'hidden', borderLeft: '1px solid #f0f2f5' }}>
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
              <button
                onClick={() => setShowMembers((v) => !v)}
                className="shrink-0 border-t border-neutral-100 py-3.5 text-sm font-semibold text-neutral-500 hover:bg-gemini-active-hover hover:text-accent-600 transition flex items-center justify-center gap-1.5"
              >
                <Users size={14} />
                {t('rooms.members')}
                {showMembers ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
              </button>
            </div>
          </Panel>
        </PanelGroup>

        {modal}
        <AnimatePresence>{showEditModal && <EditRoomModal room={room} onClose={() => setShowEditModal(false)} />}</AnimatePresence>
        <Modal open={infoOpen} onClose={() => setInfoOpen(false)} size="md">
          {infoMeta}
        </Modal>
        {deleteConfirmModal}
      </div>
    );
  }

  /* ---------- MOBILE ---------- */
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <header className="relative glass-header shadow-[0_0.5px_0_rgba(0,0,0,0.06)] shrink-0 px-2 h-12 flex items-center gap-1">
        <button
          onClick={() => navigate('/rooms')}
          className="p-2 text-neutral-500 hover:text-neutral-900 rounded-lg shrink-0"
        >
          <ChevronLeft size={20} />
        </button>
        {/* Clickable title: info icon + room name */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-20">
          <div className="pointer-events-auto max-w-full overflow-hidden">
            <button
              onClick={() => setInfoOpen(true)}
              className="flex items-center gap-1.5 hover:bg-white/50 px-2 py-1 rounded-xl transition max-w-full min-w-0"
            >
              <Info size={15} className="text-neutral-400 shrink-0" />
              {room.coverUrl && (
                <img
                  src={getMediaUrl(room.coverUrl)}
                  alt=""
                  className="w-6 h-6 rounded-md object-cover shrink-0"
                />
              )}
              <h1 className="font-display text-lg font-bold text-neutral-900 truncate">
                {room.name}
              </h1>
            </button>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-0.5 shrink-0">
          {importantStar}
          <button
            onClick={() => setMembersOpen(true)}
            className="p-2 rounded-lg transition text-neutral-500 hover:text-accent-600"
          >
            <Users size={20} />
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-hidden">
        {chat}
      </div>

      {/* Members Modal — full-height sheet */}
      <Modal open={membersOpen} onClose={() => setMembersOpen(false)} title={t('rooms.members')} fullHeight>
        {members}
      </Modal>

      {/* Info + Polls Modal — full-height sheet */}
      <Modal open={infoOpen} onClose={() => setInfoOpen(false)} fullHeight>
        <div className="overflow-y-auto h-full px-6 pt-2 pb-8 space-y-4">
          {infoMeta}
          <div className="border-t border-neutral-100 pt-1">
            {polls}
          </div>
        </div>
      </Modal>

      {modal}
      <AnimatePresence>{showEditModal && <EditRoomModal room={room} onClose={() => setShowEditModal(false)} />}</AnimatePresence>
      {deleteConfirmModal}
    </div>
  );
}
