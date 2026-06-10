import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MessageCircle, Search, Trash2 } from 'lucide-react';
import { useDmChats, useDeleteDmChat } from '../shared/api/dm.hooks';
import { Avatar } from '../shared/ui/Avatar';
import { PageHeader } from '../shared/ui';
import { relativeTime } from '../shared/lib/relativeTime';

// Зміни: кнопка видалення з'являється розширенням від ширини 0 (не translate)
// Чат стискається, а не зсувається

const DELETE_BTN_WIDTH = 76;
const SWIPE_THRESHOLD = 50;

function SwipeableChat({
  chat,
  onOpen,
  onDelete,
}: {
  chat: { id: string; peer: { fullName: string; avatarUrl: string | null; username: string; isOnline: boolean; lastSeenAt: string }; lastMessage: { id: string; content: string; createdAt: string; isOwn: boolean } | null; lastMessageAt: string };
  onOpen: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const [revealW, setRevealW] = useState(0); // 0 → DELETE_BTN_WIDTH
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isHoriz = useRef<boolean | null>(null);
  const lastRevealW = useRef(0);

  function onTouchStart(e: React.TouchEvent) {
    const touch = e.touches[0];
    if (!touch) return;
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    isHoriz.current = null;
    lastRevealW.current = revealW;
  }

  function onTouchMove(e: React.TouchEvent) {
    const touch = e.touches[0];
    if (!touch) return;
    const dx = touchStartX.current - touch.clientX; // positive = swipe left
    const dy = Math.abs(touch.clientY - touchStartY.current);

    if (isHoriz.current === null && (Math.abs(dx) > 5 || dy > 5)) {
      isHoriz.current = Math.abs(dx) > dy;
    }
    if (!isHoriz.current) return;

    const next = Math.max(0, Math.min(DELETE_BTN_WIDTH, lastRevealW.current + dx));
    setRevealW(next);
  }

  function onTouchEnd() {
    if (!isHoriz.current) return;
    setRevealW(revealW >= SWIPE_THRESHOLD ? DELETE_BTN_WIDTH : 0);
  }

  function handleChatClick() {
    if (revealW > 0) {
      setRevealW(0);
      return;
    }
    onOpen();
  }

  const isTransitioning = isHoriz.current === null || !isHoriz.current;
  const transition = isTransitioning
    ? 'width 0.22s cubic-bezier(0.2,0,0,1)'
    : 'none';

  return (
    <div className="flex items-stretch overflow-hidden">
      {/* Chat content — shrinks naturally as delete button expands */}
      <div
        style={{ flex: 1, minWidth: 0 }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={handleChatClick}
        className="cursor-pointer"
      >
        <div className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/50 transition text-left">
          <Avatar
            fullName={chat.peer.fullName}
            avatarUrl={chat.peer.avatarUrl}
            size={44}
            isOnline={chat.peer.isOnline}
            showStatus
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-neutral-900 truncate">{chat.peer.fullName}</p>
              <span className="text-[10px] text-neutral-400 shrink-0">
                {relativeTime(chat.lastMessageAt)}
              </span>
            </div>
            <p className="text-xs text-neutral-500 truncate mt-0.5">
              {chat.lastMessage ? (
                <>
                  {chat.lastMessage.isOwn && (
                    <span className="text-neutral-400">{t('dm.you', 'Ви')}: </span>
                  )}
                  {chat.lastMessage.content}
                </>
              ) : (
                <span className="text-neutral-400 italic">
                  {t('dm.noMessages', 'Ще немає повідомлень')}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Delete button — expands from width 0, separate element */}
      <div
        style={{ width: revealW, transition, overflow: 'hidden', flexShrink: 0 }}
        className="bg-red-500 flex items-center justify-center"
      >
        <button
          onClick={onDelete}
          style={{ width: DELETE_BTN_WIDTH }}
          className="h-full flex flex-col items-center justify-center gap-0.5 text-white active:bg-red-600 transition shrink-0"
        >
          <Trash2 size={18} />
          <span className="text-[10px] font-semibold">{t('dm.deleteChat', 'Видалити')}</span>
        </button>
      </div>
    </div>
  );
}

export function ChatPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: chats, isLoading } = useDmChats();
  const deleteChat = useDeleteDmChat();

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  async function handleDelete(chatId: string) {
    await deleteChat.mutateAsync(chatId);
    setDeleteConfirmId(null);
  }

  return (
    <div className="h-full flex flex-col font-body">
      <PageHeader
        title={<span className="font-display">{t('nav.titles.chats')}</span>}
        right={
          <button
            onClick={() => navigate('/search')}
            className="flex items-center justify-center w-9 h-9 glass-icon"
            title={t('search.title', 'Пошук') as string}
            aria-label={t('search.title', 'Пошук') as string}
          >
            <Search size={18} />
          </button>
        }
      />

      <main className="flex-1 overflow-y-auto w-full px-4 md:px-6 py-4">
        {isLoading && (
          <p className="text-neutral-400 text-center animate-pulse py-12">
            {t('common.loading')}
          </p>
        )}

        {!isLoading && (!chats || chats.length === 0) && (
          <div className="flex flex-col items-center justify-center gap-3 text-neutral-400 text-center py-16">
            <MessageCircle size={42} strokeWidth={1.5} />
            <p className="text-sm">{t('dm.emptyTitle', 'Поки немає особистих чатів')}</p>
            <button
              onClick={() => navigate('/contacts')}
              className="text-accent-600 text-sm font-medium hover:underline"
            >
              {t('dm.goContacts', 'Перейти до контактів')}
            </button>
          </div>
        )}

        {chats && chats.length > 0 && (
          <div className="glass-card overflow-hidden divide-y divide-white/40">
            {chats.map((c) =>
              deleteConfirmId === c.id ? (
                <div key={c.id} className="flex items-center gap-2 px-4 py-3 bg-danger-500/8">
                  <p className="flex-1 text-sm text-danger-700 font-medium">
                    {t('dm.deleteChatConfirm', 'Видалити цей чат?')}
                  </p>
                  <button
                    onClick={() => handleDelete(c.id)}
                    disabled={deleteChat.isPending}
                    className="text-xs bg-red-500 text-white rounded-xl px-3 py-1.5 hover:bg-red-600 transition disabled:opacity-50"
                  >
                    {deleteChat.isPending ? '…' : t('common.yes', 'Так')}
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="text-xs bg-white/55 border border-white/70 text-neutral-600 rounded-xl px-3 py-1.5 hover:bg-white/72 transition"
                  >
                    {t('common.no', 'Ні')}
                  </button>
                </div>
              ) : (
                <SwipeableChat
                  key={c.id}
                  chat={c}
                  onOpen={() => navigate(`/dm/${c.peer.username}`)}
                  onDelete={() => setDeleteConfirmId(c.id)}
                />
              ),
            )}
          </div>
        )}
      </main>
    </div>
  );
}
