import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, X, UserPlus, Check, Loader2 } from 'lucide-react';
import { useSearchUsers } from '../shared/api/profile.hooks';
import type { UserSearchBy } from '../shared/api/profile.api';
import { useContacts, useAddContact } from '../shared/api/contacts.hooks';
import { Avatar } from '../shared/ui/Avatar';
import { BackButton, PageHeader, cn } from '../shared/ui';

const TABS: { id: UserSearchBy; label: string }[] = [
  { id: 'auto', label: 'Авто' },
  { id: 'name', label: 'ФІО' },
  { id: 'username', label: 'Username' },
  { id: 'email', label: 'Email' },
  { id: 'phone', label: 'Телефон' },
];

// Невелика debounce-обгортка через useEffect.
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function SearchPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [by, setBy] = useState<UserSearchBy>('auto');
  const debounced = useDebouncedValue(q, 250);

  const { data: results, isFetching } = useSearchUsers(debounced, by);
  const { data: contacts } = useContacts();
  const addContact = useAddContact();

  const contactIds = new Set((contacts ?? []).map((c) => c.user.id));

  function handleAdd(userId: string, e: React.MouseEvent) {
    e.stopPropagation();
    addContact.mutate(userId);
  }

  return (
    <div className="h-full flex flex-col bg-neutral-50 font-body">
      <PageHeader
        title={<span className="font-display">{t('nav.titles.search')}</span>}
        left={<BackButton />}
      />

      <div className="bg-white/65 backdrop-blur-2xl border-b border-white/40 px-4 md:px-6 pt-3 pb-2 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-2 bg-neutral-50 rounded-xl px-3 h-11 border border-neutral-100 focus-within:border-accent-500 transition">
            <Search size={16} className="text-neutral-400 shrink-0" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('search.placeholder', 'Пошук друзів — ФІО, username, email або телефон')}
              className="flex-1 bg-transparent outline-none text-sm text-neutral-900 placeholder:text-neutral-400"
            />
            {q && (
              <button
                onClick={() => setQ('')}
                className="text-neutral-400 hover:text-neutral-600 shrink-0"
                aria-label={t('common.clear', 'Очистити')}
              >
                <X size={15} />
              </button>
            )}
          </div>
          <div className="flex gap-1.5 mt-2 overflow-x-auto -mx-1 px-1 pb-1 scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setBy(tab.id)}
                className={cn(
                  'shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition border',
                  by === tab.id
                    ? 'bg-accent-50 border-accent-500/40 text-accent-600'
                    : 'bg-white border-neutral-100 text-neutral-500 hover:border-accent-500/30 hover:text-neutral-700',
                )}
              >
                {t(`search.by.${tab.id}`, tab.label)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto max-w-2xl mx-auto w-full px-4 md:px-6 py-4">
        {q.trim().length < 2 && (
          <p className="text-center text-neutral-400 text-sm py-12">
            {t('search.hint', 'Введіть мінімум 2 символи, щоб почати пошук')}
          </p>
        )}

        {q.trim().length >= 2 && isFetching && (
          <p className="text-center text-neutral-400 text-sm py-12 animate-pulse">
            {t('common.loading')}
          </p>
        )}

        {q.trim().length >= 2 && !isFetching && results && results.length === 0 && (
          <p className="text-center text-neutral-400 text-sm py-12">
            {t('search.empty', 'Нікого не знайдено за «{{query}}»', { query: q })}
          </p>
        )}

        {results && results.length > 0 && (
          <ul className="bg-white rounded-2xl border border-neutral-100 shadow-sm divide-y divide-neutral-100 overflow-hidden">
            {results.map((u) => {
              const isContact = contactIds.has(u.id);
              return (
                <li key={u.id} className="flex items-center gap-3 p-4 hover:bg-neutral-50 transition">
                  <button
                    onClick={() => navigate(`/u/${u.username}`)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    <Avatar
                      fullName={u.fullName}
                      avatarUrl={u.avatarUrl}
                      size={44}
                      isOnline={u.isOnline}
                      showStatus
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-neutral-900 truncate">{u.fullName}</p>
                      <p className="text-xs text-neutral-400 truncate">
                        @{u.username}
                        {u.city && ` · ${u.city}`}
                      </p>
                    </div>
                  </button>
                  {isContact ? (
                    <span
                      className="flex items-center justify-center gap-1 px-2.5 h-8 rounded-lg bg-neutral-100 text-neutral-500 text-[11px] font-semibold"
                      title={t('search.alreadyAdded', 'Вже в контактах')}
                    >
                      <Check size={13} />
                      {t('search.added', 'Додано')}
                    </span>
                  ) : (
                    <button
                      onClick={(e) => handleAdd(u.id, e)}
                      disabled={addContact.isPending}
                      className="flex items-center justify-center gap-1 px-2.5 h-8 rounded-lg bg-brand-gradient hover:bg-brand-gradient-hover text-white text-[11px] font-semibold transition disabled:opacity-60"
                    >
                      {addContact.isPending && addContact.variables === u.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <UserPlus size={13} />
                      )}
                      {t('search.add', 'Додати')}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
