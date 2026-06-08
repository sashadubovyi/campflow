import { useTranslation } from 'react-i18next';
import { useBlockedUsers, useUnblockUser } from '../shared/api/blocks.hooks';
import { Avatar } from '../shared/ui/Avatar';
import { relativeTime } from '../shared/lib/relativeTime';
import { BackButton, PageHeader } from '../shared/ui';
import { ShieldOff } from 'lucide-react';

export function BlockedUsersPage() {
  const { t } = useTranslation();
  const { data: blocked, isLoading } = useBlockedUsers();
  const unblock = useUnblockUser();

  return (
    <div className="h-full flex flex-col bg-neutral-50 font-body">
      <PageHeader title={<span className="font-display">&amp; Blocked</span>} left={<BackButton />} />

      <main className="flex-1 overflow-y-auto max-w-2xl mx-auto w-full px-4 md:px-6 py-6">
        {isLoading && (
          <p className="text-neutral-400 text-center animate-pulse">{t('common.loading')}</p>
        )}

        {!isLoading && blocked && blocked.length === 0 && (
          <div className="bg-white rounded-2xl border border-neutral-100 border-dashed p-10 text-center flex flex-col items-center">
            <ShieldOff size={40} className="text-neutral-300 mb-3" />
            <p className="font-display text-lg text-neutral-900 mb-1">{t('blocked.empty')}</p>
            <p className="text-neutral-400 text-sm">{t('blocked.emptyHint')}</p>
          </div>
        )}

        {blocked && blocked.length > 0 && (
          <ul className="bg-white rounded-2xl border border-neutral-100 shadow-sm divide-y divide-neutral-100 overflow-hidden">
            {blocked.map((b) => (
              <li key={b.id} className="flex items-center gap-3 p-4">
                <Avatar fullName={b.user.fullName} avatarUrl={b.user.avatarUrl} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-neutral-900 truncate">{b.user.fullName}</p>
                  <p className="text-xs text-neutral-400 truncate">@{b.user.username}</p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    {t('blocked.blockedAt', { time: relativeTime(b.blockedAt) })}
                    {b.reason && <> · «{b.reason}»</>}
                  </p>
                </div>
                <button
                  onClick={() => unblock.mutate(b.user.id)}
                  disabled={unblock.isPending}
                  className="text-xs text-accent-600 hover:bg-neutral-50 font-semibold px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                >
                  {t('blocked.unblock')}
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
