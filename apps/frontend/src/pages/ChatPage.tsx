import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MessageCircle } from 'lucide-react';
import { useDmChats } from '../shared/api/dm.hooks';
import { Avatar } from '../shared/ui/Avatar';
import { PageHeader } from '../shared/ui';
import { relativeTime } from '../shared/lib/relativeTime';

export function ChatPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: chats, isLoading } = useDmChats();

  return (
    <div className="h-full flex flex-col bg-neutral-50 font-body">
      <PageHeader title={<span className="font-display">&amp; chats</span>} />

      <main className="flex-1 overflow-y-auto max-w-2xl mx-auto w-full px-4 md:px-6 py-4">
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
              <li key={c.id}>
                <button
                  onClick={() => navigate(`/dm/${c.peer.username}`)}
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
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
