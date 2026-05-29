import { useNavigate } from 'react-router-dom';
import { useContacts, useRemoveContact } from '../shared/api/contacts.hooks';
import { Avatar } from '../shared/ui/Avatar';
import { relativeTime } from '../shared/lib/relativeTime';

export function ContactsPage() {
  const navigate = useNavigate();
  const { data: contacts, isLoading } = useContacts();
  const remove = useRemoveContact();

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
          <span className="font-display text-lg font-bold text-forest-900">Мої контакти</span>
          <span className="w-16" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-6">
        {isLoading && <p className="text-forest-500 text-center animate-pulse">Завантаження…</p>}

        {!isLoading && contacts && contacts.length === 0 && (
          <div className="bg-white rounded-2xl border border-forest-100 border-dashed p-10 text-center">
            <p className="text-3xl mb-3">📒</p>
            <p className="font-display text-lg text-forest-900 mb-1">Контактів немає</p>
            <p className="text-forest-700 text-sm">
              Додавайте людей з їхніх профілів — кнопка «+ Додати в контакти».
            </p>
          </div>
        )}

        {contacts && contacts.length > 0 && (
          <ul className="bg-white rounded-2xl border border-forest-100 shadow-sm divide-y divide-forest-100 overflow-hidden">
            {contacts.map((c) => (
              <li key={c.id} className="flex items-center gap-3 p-4 hover:bg-forest-50 transition">
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
                    <p className="font-medium text-forest-900 truncate flex items-center gap-1.5">
                      {c.user.fullName}
                      {c.isMutual && <span title="Взаємно">🔁</span>}
                    </p>
                    <p className="text-xs text-forest-500 truncate">
                      @{c.user.username}
                      {c.user.city && ` · ${c.user.city}`}
                    </p>
                    {!c.user.isOnline && (
                      <p className="text-[10px] text-forest-500 mt-0.5">
                        був(-ла) {relativeTime(c.user.lastSeenAt)}
                      </p>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => remove.mutate(c.user.id)}
                  disabled={remove.isPending}
                  className="text-red-500 hover:text-red-700 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                  title="Видалити з контактів"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        {contacts && contacts.length > 0 && (
          <p className="text-xs text-forest-500 text-center mt-4">
            {contacts.length} {contacts.length === 1 ? 'контакт' : 'контактів'} · 🔁 — взаємно
            додані
          </p>
        )}
      </main>
    </div>
  );
}
