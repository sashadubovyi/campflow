import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useContacts, useRemoveContact } from '../shared/api/contacts.hooks';
import { useBlockUser } from '../shared/api/blocks.hooks';
import { Avatar } from '../shared/ui/Avatar';
import { relativeTime } from '../shared/lib/relativeTime';
import { BackButton, PageHeader, cn } from '../shared/ui';
import { Modal } from '../shared/ui/Modal';
import { Users, UserCheck, Clock, MessageCircle, Trash2, Search, ShieldX } from 'lucide-react';

type Tab = 'mutual' | 'pending';

interface RemoveTarget {
  userId: string;
  fullName: string;
}

export function ContactsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: contacts, isLoading } = useContacts();
  const remove = useRemoveContact();
  const block = useBlockUser();
  const [tab, setTab] = useState<Tab>('mutual');
  const [removeTarget, setRemoveTarget] = useState<RemoveTarget | null>(null);

  async function handleRemoveOnly() {
    if (!removeTarget) return;
    await remove.mutateAsync(removeTarget.userId);
    setRemoveTarget(null);
  }

  async function handleRemoveAndBlock() {
    if (!removeTarget) return;
    await block.mutateAsync({ userId: removeTarget.userId });
    // remove invalidates contacts автоматично через useBlockUser onSuccess,
    // але деякі бекенди не видаляють контакт при блоці — підстрахуємось.
    await remove.mutateAsync(removeTarget.userId).catch(() => undefined);
    setRemoveTarget(null);
  }

  const { mutual, pending } = useMemo(() => {
    const list = contacts ?? [];
    return {
      mutual: list.filter((c) => c.isMutual),
      pending: list.filter((c) => !c.isMutual),
    };
  }, [contacts]);

  const visible = tab === 'mutual' ? mutual : pending;

  return (
    <div className="h-full flex flex-col bg-neutral-50 font-body">
      <PageHeader
        title={<span className="font-display">{t('nav.titles.friends')}</span>}
        left={<BackButton />}
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

      <main className="flex-1 overflow-y-auto w-full px-4 md:px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl mb-4">
          <TabButton
            active={tab === 'mutual'}
            onClick={() => setTab('mutual')}
            icon={<UserCheck size={14} />}
            label={t('contacts.tabs.mutual', 'Взаємні')}
            count={mutual.length}
          />
          <TabButton
            active={tab === 'pending'}
            onClick={() => setTab('pending')}
            icon={<Clock size={14} />}
            label={t('contacts.tabs.pending', 'Не прийняті')}
            count={pending.length}
          />
        </div>

        {isLoading && (
          <p className="text-neutral-400 text-center animate-pulse">{t('common.loading')}</p>
        )}

        {!isLoading && visible.length === 0 && (
          <div className="bg-white rounded-2xl border border-neutral-100 border-dashed p-10 text-center flex flex-col items-center">
            <Users size={40} className="text-neutral-300 mb-3" />
            <p className="font-display text-lg text-neutral-900 mb-1">
              {tab === 'mutual'
                ? t('contacts.empty')
                : t('contacts.emptyPending', 'Очікують підтвердження')}
            </p>
            <p className="text-neutral-400 text-sm">{t('contacts.emptyHint')}</p>
          </div>
        )}

        {visible.length > 0 && (
          <ul className="bg-white rounded-2xl border border-neutral-100 shadow-sm divide-y divide-neutral-100 overflow-hidden">
            {visible.map((c) => (
              <li key={c.id} className="flex items-center gap-3 p-4 hover:bg-neutral-50 transition">
                <button
                  onClick={() => navigate(`/u/${c.user.username}`)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left"
                >
                  <Avatar
                    fullName={c.user.fullName}
                    avatarUrl={c.user.avatarUrl}
                    size={44}
                    isOnline={c.user.isOnline}
                    showStatus
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-neutral-900 truncate flex items-center gap-1.5">
                      {c.user.fullName}
                      {c.isMutual ? (
                        <UserCheck size={13} className="text-accent-500 shrink-0" />
                      ) : (
                        <Clock size={12} className="text-neutral-400 shrink-0" />
                      )}
                    </p>
                    <p className="text-xs text-neutral-400 truncate">
                      @{c.user.username}
                      {c.user.city && ` · ${c.user.city}`}
                    </p>
                    {!c.user.isOnline && (
                      <p className="text-[10px] text-neutral-400 mt-0.5">
                        {t('profile.wasOnline', { time: relativeTime(c.user.lastSeenAt) })}
                      </p>
                    )}
                  </div>
                </button>
                {c.isMutual && (
                  <button
                    onClick={() => navigate(`/dm/${c.user.username}`)}
                    className="flex items-center justify-center w-9 h-9 rounded-lg bg-gemini-active border border-accent-200/40 text-accent-600 hover:bg-gemini-active-hover transition-all duration-200"
                    title={t('contacts.message', 'Написати')}
                    aria-label={t('contacts.message', 'Написати')}
                  >
                    <MessageCircle size={16} />
                  </button>
                )}
                <button
                  onClick={() => setRemoveTarget({ userId: c.user.id, fullName: c.user.fullName })}
                  className="flex items-center justify-center w-9 h-9 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition"
                  title={t('common.remove')}
                  aria-label={t('common.remove')}
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>

      <Modal
        open={removeTarget !== null}
        onClose={() => setRemoveTarget(null)}
        size="sm"
      >
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto">
            <Trash2 size={22} className="text-red-500" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-neutral-900 mb-1">
              {t('contacts.removeTitle', 'Видалити з контактів?')}
            </h3>
            <p className="text-sm text-neutral-500">
              {t('contacts.removeText', '{{name}} більше не буде у твоїх контактах.', {
                name: removeTarget?.fullName ?? '',
              })}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={handleRemoveOnly}
              disabled={remove.isPending || block.isPending}
              className="w-full flex items-center justify-center gap-1.5 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition text-sm"
            >
              <Trash2 size={15} />
              {t('contacts.removeOnly', 'Тільки видалити')}
            </button>
            <button
              onClick={handleRemoveAndBlock}
              disabled={remove.isPending || block.isPending}
              className="w-full flex items-center justify-center gap-1.5 border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60 font-semibold py-2.5 rounded-xl transition text-sm"
            >
              <ShieldX size={15} />
              {t('contacts.removeAndBlock', 'Видалити і заблокувати')}
            </button>
            <button
              onClick={() => setRemoveTarget(null)}
              className="w-full glass-btn py-2.5 text-sm"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition',
        active ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700',
      )}
    >
      {icon}
      <span>{label}</span>
      <span
        className={cn(
          'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold',
          active ? 'bg-accent-50 text-accent-600' : 'bg-neutral-200 text-neutral-500',
        )}
      >
        {count}
      </span>
    </button>
  );
}
