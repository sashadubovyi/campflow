import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MessageCircle, Search, Trash2 } from 'lucide-react';
import { useDmChats, useDeleteDmChat } from '../shared/api/dm.hooks';
import { Avatar } from '../shared/ui/Avatar';
import { PageHeader } from '../shared/ui';
import { relativeTime } from '../shared/lib/relativeTime';

export function ChatPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: chats, isLoading } = useDmChats();
  const deleteChat = useDeleteDmChat();

  const [menuChatId, setMenuChatId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  function startLongPress(chatId: string, e: React.TouchEvent) {
    const t = e.touches[0];
    if (!t) return;
    touchStart.current = { x: t.clientX, y: t.clientY };
    longPressTimer.current = setTimeout(() => {
      setMenuChatId(chatId);
      if ('vibrate' in navigator) {
        try { navigator.vibrate?.(15); } catch { /* ignore */ }
      }
    }, 550);
  }

  function moveLongPress(e: React.TouchEvent) {
    const touch = e.touches[0];
    if (!touch || !touchStart.current) return;
    const dx = Math.abs(touch.clientX - touchStart.current.x);
    const dy = Math.abs(touch.clientY - touchStart.current.y);
    if (dx > 10 || dy > 10) cancelLongPress();
  }

  function cancelLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  function closeMenu() {
    setMenuChatId(null);
    setDeleteConfirmId(null);
  }

  async function handleDeleteChat(chatId: string) {
    await deleteChat.mutateAsync(chatId);
    closeMenu();
  }

  return (
    <div className="h-full flex flex-col bg-neutral-50 font-body" onClick={menuChatId ? closeMenu : undefined}>
      <PageHeader
        title={<span className="font-display">{t('nav.titles.chats')}</span>}
        right={
          <button
            onClick={() => navigate('/search')}
            className="flex items-center justify-center w-9 h-9 rounded-xl text-neutral-500 hover:bg-neutral-100 hover:text-accent-600 transition"
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
            <p className="text-sm">
              {t('dm.emptyTitle', 'Поки немає особистих чатів')}
            </p>
            <button
              onClick={() => navigate('/contacts')}
              className="text-accent-600 text-sm font-medium hover:underline"
            >
              {t('dm.goContacts', 'Перейти до контактів')}
            </button>
          </div>
        )}

        {chats && chats.length > 0 && (
          <ul className="bg-white rounded-2xl border border-neutral-100 shadow-sm divide-y divide-neutral-100 overflow-hidden">
            {chats.map((c) => (
              <li key={c.id} className="relative">
                <button
                  onClick={(e) => {
                    if (menuChatId === c.id) { e.stopPropagation(); closeMenu(); return; }
                    navigate(`/dm/${c.peer.username}`);
                  }}
                  onTouchStart={(e) => startLongPress(c.id, e)}
                  onTouchMove={moveLongPress}
                  onTouchEnd={cancelLongPress}
                  onTouchCancel={cancelLongPress}
                  className="w-full flex items-center gap-3 p-4 hover:bg-neutral-50 transition text-left"
                >
                  <Avatar
                    fullName={c.peer.fullName}
                    avatarUrl={c.peer.avatarUrl}
                    size={44}
                    isOnline={c.peer.isOnline}
                    showStatus
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-neutral-900 truncate">
                        {c.peer.fullName}
                      </p>
                      <span className="text-[10px] text-neutral-400 shrink-0">
                        {relativeTime(c.lastMessageAt)}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 truncate mt-0.5">
                      {c.lastMessage ? (
                        <>
                          {c.lastMessage.isOwn && (
                            <span className="text-neutral-400">{t('dm.you', 'Ви')}: </span>
                          )}
                          {c.lastMessage.content}
                        </>
                      ) : (
                        <span className="text-neutral-400 italic">
                          {t('dm.noMessages', 'Ще немає повідомлень')}
                        </span>
                      )}
                    </p>
                  </div>
                </button>

                {/* Context menu after long-press */}
                {menuChatId === c.id && (
                  <div
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-30 bg-white rounded-xl shadow-card-lg border border-neutral-100 py-1 min-w-[160px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {deleteConfirmId !== c.id ? (
                      <button
                        onClick={() => setDeleteConfirmId(c.id)}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 transition"
                      >
                        <Trash2 size={14} />
                        {t('dm.deleteChat', 'Видалити чат')}
                      </button>
                    ) : (
                      <div className="px-3 py-2">
                        <p className="text-xs text-neutral-500 mb-2">
                          {t('dm.deleteChatConfirm', 'Видалити весь чат?')}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDeleteChat(c.id)}
                            disabled={deleteChat.isPending}
                            className="flex-1 text-xs bg-red-500 text-white rounded-lg py-1.5 hover:bg-red-600 transition disabled:opacity-50"
                          >
                            {deleteChat.isPending ? '…' : t('common.yes', 'Так')}
                          </button>
                          <button
                            onClick={closeMenu}
                            className="flex-1 text-xs bg-neutral-100 text-neutral-600 rounded-lg py-1.5 hover:bg-neutral-200 transition"
                          >
                            {t('common.no', 'Ні')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
