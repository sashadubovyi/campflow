import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useContacts, useRemoveContact } from '../shared/api/contacts.hooks';
import { Avatar } from '../shared/ui/Avatar';
import { relativeTime } from '../shared/lib/relativeTime';
import { BackButton, PageHeader, cn } from '../shared/ui';
import { Users, UserCheck, Clock, MessageCircle, Trash2 } from 'lucide-react';

type Tab = 'mutual' | 'pending';

export function ContactsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: contacts, isLoading } = useContacts();
  const remove = useRemoveContact();
  const [tab, setTab] = useState<Tab>('mutual');

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
      <PageHeader title={t('contacts.title')} left={<BackButton />} />

      <main className="flex-1 overflow-y-auto max-w-2xl mx-auto w-full px-4 md:px-6 py-6">
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
                    className="flex items-center justify-center w-9 h-9 rounded-lg text-neutral-400 hover:text-accent-600 hover:bg-accent-50 transition"
                    title={t('contacts.message', 'Написати')}
                    aria-label={t('contacts.message', 'Написати')}
                  >
                    <MessageCircle size={16} />
                  </button>
                )}
                <button
                  onClick={() => remove.mutate(c.user.id)}
                  disabled={remove.isPending}
                  className="flex items-center justify-center w-9 h-9 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-50"
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
