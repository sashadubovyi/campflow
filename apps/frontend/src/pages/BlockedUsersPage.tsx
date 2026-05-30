import { useNavigate } from 'react-router-dom';
import { useBlockedUsers, useUnblockUser } from '../shared/api/blocks.hooks';
import { Avatar } from '../shared/ui/Avatar';
import { relativeTime } from '../shared/lib/relativeTime';

export function BlockedUsersPage() {
  const navigate = useNavigate();
  const { data: blocked, isLoading } = useBlockedUsers();
  const unblock = useUnblockUser();

  return (
    <div className="min-h-screen bg-forest-50 font-body">
      <header className="bg-white border-b border-forest-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-forest-600 hover:text-forest-900 text-sm font-medium"
          >
            ← Назад
          </button>
          <span className="font-display text-lg font-bold text-forest-900">Заблоковані</span>
          <span className="w-16" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-6">
        {isLoading && <p className="text-forest-500 text-center animate-pulse">Завантаження…</p>}

        {!isLoading && blocked && blocked.length === 0 && (
          <div className="bg-white rounded-2xl border border-forest-100 border-dashed p-10 text-center">
            <p className="text-3xl mb-3">✨</p>
            <p className="font-display text-lg text-forest-900 mb-1">Список порожній</p>
            <p className="text-forest-700 text-sm">Ви нікого не заблокували. Це гарно!</p>
          </div>
        )}

        {blocked && blocked.length > 0 && (
          <ul className="bg-white rounded-2xl border border-forest-100 shadow-sm divide-y divide-forest-100 overflow-hidden">
            {blocked.map((b) => (
              <li key={b.id} className="flex items-center gap-3 p-4">
                <Avatar fullName={b.user.fullName} avatarUrl={b.user.avatarUrl} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-forest-900 truncate">{b.user.fullName}</p>
                  <p className="text-xs text-forest-500 truncate">@{b.user.username}</p>
                  <p className="text-[10px] text-forest-500 mt-0.5">
                    заблоковано {relativeTime(b.blockedAt)}
                    {b.reason && <> · «{b.reason}»</>}
                  </p>
                </div>
                <button
                  onClick={() => unblock.mutate(b.user.id)}
                  disabled={unblock.isPending}
                  className="text-xs text-forest-600 hover:bg-forest-50 font-semibold px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                >
                  Розблокувати
                </button>
              </li>
            ))}
          </ul>
        )}

        {blocked && blocked.length > 0 && (
          <p className="text-xs text-forest-500 text-center mt-4">
            {blocked.length} {blocked.length === 1 ? 'юзер' : 'юзерів'}
          </p>
        )}
      </main>
    </div>
  );
}
