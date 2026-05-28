import { useEffect, useState } from 'react';

interface Health {
  status: string;
  service: string;
  checks?: { database: string };
}

function Row({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-forest-100 last:border-0">
      <span className="text-forest-500 text-sm">{label}</span>
      <span
        className={
          ok === undefined
            ? 'text-forest-900 font-medium'
            : ok
              ? 'text-forest-600 font-semibold'
              : 'text-red-600 font-semibold'
        }
      >
        {value}
      </span>
    </div>
  );
}

export function App() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then(setHealth)
      .catch((e) => setError(String(e)));
  }, []);

  return (
    <div className="min-h-screen bg-forest-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <h1 className="font-display text-6xl font-bold text-forest-900 tracking-tight">
            Camp<span className="text-ember-500">Flow</span>
          </h1>
          <p className="font-body text-forest-700 mt-3 text-lg">
            Хаос обговорень → чіткий план
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-forest-900/5 border border-forest-100 p-6">
          <h2 className="font-display text-sm uppercase tracking-widest text-forest-500 mb-4">
            Стан системи
          </h2>

          {error && (
            <p className="text-red-600 font-body text-sm">Помилка з'єднання: {error}</p>
          )}

          {!health && !error && (
            <p className="text-forest-500 font-body animate-pulse">Перевірка з'єднання…</p>
          )}

          {health && (
            <div className="font-body">
              <Row label="Сервіс" value={health.service} />
              <Row label="Статус" value={health.status} ok={health.status === 'ok'} />
              {health.checks && (
                <Row
                  label="База даних"
                  value={health.checks.database}
                  ok={health.checks.database === 'ok'}
                />
              )}
            </div>
          )}
        </div>

        <p className="text-center text-forest-500 text-xs mt-6 font-body">
          Фронтенд успішно з'єднано з бекендом ✓
        </p>
      </div>
    </div>
  );
}
