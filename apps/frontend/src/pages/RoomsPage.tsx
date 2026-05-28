import { useAuth } from '../shared/store/useAuth';

export function RoomsPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-forest-50 px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl font-bold text-forest-900">
            Camp<span className="text-ember-500">Flow</span>
          </h1>
          <div className="flex items-center gap-4 font-body">
            <span className="text-forest-700 text-sm">{user?.fullName}</span>
            <button
              onClick={logout}
              className="text-sm text-forest-600 hover:text-forest-900 font-medium"
            >
              Вийти
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-forest-900/5 border border-forest-100 p-8 text-center">
          <p className="font-display text-xl text-forest-900 mb-2">Вітаємо, {user?.fullName}! 🏕️</p>
          <p className="font-body text-forest-700">
            Ви успішно увійшли. Тут скоро з'явиться список ваших кімнат.
          </p>
          <div className="mt-6 inline-block bg-forest-50 rounded-xl px-4 py-3 font-body text-sm text-forest-700">
            <div>Email: {user?.email}</div>
            <div>Мова інтерфейсу: {user?.locale}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
