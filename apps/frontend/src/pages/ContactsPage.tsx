import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useContacts, useRemoveContact } from '../shared/api/contacts.hooks';
import { Avatar } from '../shared/ui/Avatar';
import { relativeTime } from '../shared/lib/relativeTime';
import { BackButton, PageHeader } from '../shared/ui';
import { Users, ArrowLeftRight } from 'lucide-react';

export function ContactsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: contacts, isLoading } = useContacts();
  const remove = useRemoveContact();

  return (
    <div className="min-h-screen bg-neutral-50 font-body">
      <PageHeader
        title={t('contacts.title')}
        left={<BackButton />}
      />

      <main className="max-w-2xl mx-auto px-6 py-6">
        {isLoading && (
          <p className="text-neutral-400 text-center animate-pulse">{t('common.loading')}</p>
        )}

        {!isLoading && contacts && contacts.length === 0 && (
          <div className="bg-white rounded-2xl border border-neutral-100 border-dashed p-10 text-center flex flex-col items-center">
            <Users size={40} className="text-neutral-300 mb-3" />
            <p className="font-display text-lg text-neutral-900 mb-1">{t('contacts.empty')}</p>
            <p className="text-neutral-400 text-sm">{t('contacts.emptyHint')}</p>
          </div>
        )}

        {contacts && contacts.length > 0 && (
          <ul className="bg-white rounded-2xl border border-neutral-100 shadow-sm divide-y divide-neutral-100 overflow-hidden">
            {contacts.map((c) => (
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
                      {c.isMutual && (
                        <ArrowLeftRight size={12} className="text-accent-500 shrink-0" />
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
                <button
                  onClick={() => remove.mutate(c.user.id)}
                  disabled={remove.isPending}
                  className="text-red-500 hover:text-red-700 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                  title={t('common.remove')}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        {contacts && contacts.length > 0 && (
          <p className="text-xs text-neutral-400 text-center mt-4">
            {t('contacts.count', { count: contacts.length })} · {t('contacts.mutual')}
          </p>
        )}
      </main>
    </div>
  );
}
