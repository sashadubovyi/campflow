import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MessageCircle, Search, Trash2 } from 'lucide-react';
import { useDmChats, useDeleteDmChat } from '../shared/api/dm.hooks';
import { Avatar } from '../shared/ui/Avatar';
import { PageHeader } from '../shared/ui';
import { relativeTime } from '../shared/lib/relativeTime';

const SWIPE_THRESHOLD = 72; // px для автоматичного розкриття кнопки
const DELETE_BTN_WIDTH = 72;

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
  const [offsetX, setOffsetX] = useState(0); // 0..DELETE_BTN_WIDTH
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isHoriz = useRef<boolean | null>(null);

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    if (!t) return;
    touchStartX.current = t.clientX;
    touchStartY.current = t.clientY;
    isHoriz.current = null;
  }

  function onTouchMove(e: React.TouchEvent) {
    const t = e.touches[0];
    if (!t) return;
    const dx = t.clientX - touchStartX.current;
    const dy = Math.abs(t.clientY - touchStartY.current);

    if (isHoriz.current === null && (Math.abs(dx) > 4 || dy > 4)) {
      isHoriz.current = Math.abs(dx) > dy;
    }

    if (isHoriz.current && dx < 0) {
      const raw = Math.min(-dx + offsetX, DELETE_BTN_WIDTH);
      setOffsetX(raw);
    } else if (isHoriz.current && dx > 0) {
      setOffsetX(Math.max(offsetX - dx, 0));
    }
  }

  function onTouchEnd() {
    if (!isHoriz.current) return;
    const snap = offsetX >= SWIPE_THRESHOLD ? DELETE_BTN_WIDTH : 0;
    setOffsetX(snap);
  }

  function handleMainClick() {
    if (offsetX > 0) {
      setOffsetX(0);
      return;
    }
    onOpen();
  }

  return (
    <div className="relative overflow-hidden">
      {/* Delete button (фіксований праворуч) */}
      <div
        style={{ width: DELETE_BTN_WIDTH }}
        className="absolute right-0 top-0 bottom-0 flex items-center justify-center bg-red-500"
      >
        <button
          onClick={onDelete}
          className="w-full h-full flex flex-col items-center justify-center gap-0.5 text-white active:bg-red-600 transition"
        >
          <Trash2 size={18} />
          <span className="text-[10px] font-semibold">{t('dm.deleteChat', 'Видалити')}</span>
        </button>
      </div>

      {/* Основний вміст (ковзає ліворуч) */}
      <div
        style={{
          transform: `translateX(-${offsetX}px)`,
          transition: isHoriz.current ? 'none' : 'transform 0.2s ease',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={handleMainClick}
        className="bg-white cursor-pointer"
      >
        <div className="w-full flex items-center gap-3 p-4 hover:bg-neutral-50 transition text-left">
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
    <div className="h-full flex flex-col bg-neutral-50 font-body">
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
          <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm divide-y divide-neutral-100 overflow-hidden">
            {chats.map((c) =>
              deleteConfirmId === c.id ? (
                <div key={c.id} className="flex items-center gap-2 px-4 py-3 bg-red-50">
                  <p className="flex-1 text-sm text-red-700 font-medium">
                    {t('dm.deleteChatConfirm', 'Видалити цей чат?')}
                  </p>
                  <button
                    onClick={() => handleDelete(c.id)}
                    disabled={deleteChat.isPending}
                    className="text-xs bg-red-500 text-white rounded-lg px-3 py-1.5 hover:bg-red-600 transition disabled:opacity-50"
                  >
                    {deleteChat.isPending ? '…' : t('common.yes', 'Так')}
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="text-xs bg-neutral-200 text-neutral-700 rounded-lg px-3 py-1.5 hover:bg-neutral-300 transition"
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
