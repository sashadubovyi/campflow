import { useState } from 'react';

interface Props {
  inviteCode: string;
}

export function InviteButton({ inviteCode }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  const inviteLink = `${window.location.origin}/join/${inviteCode}`;

  async function copy(value: string, what: 'code' | 'link') {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(what);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // clipboard може бути недоступний — ігноруємо
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm bg-ember-500 hover:bg-ember-400 text-white font-semibold px-4 py-1.5 rounded-xl transition"
      >
        Запросити
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-forest-900/40 flex items-center justify-center px-4 z-50"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 font-body"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-xl font-bold text-forest-900 mb-1">
              Запросити учасників
            </h2>
            <p className="text-sm text-forest-700 mb-5">
              Поділіться кодом або посиланням — друзі приєднаються до кімнати.
            </p>

            <label className="block text-xs font-medium text-forest-500 mb-1.5">
              Код запрошення
            </label>
            <div className="flex gap-2 mb-4">
              <div className="flex-1 px-4 py-2.5 rounded-xl border border-forest-100 bg-forest-50 font-mono tracking-widest text-forest-900 text-center">
                {inviteCode}
              </div>
              <button
                onClick={() => copy(inviteCode, 'code')}
                className="px-4 rounded-xl border border-forest-100 text-forest-700 font-semibold hover:bg-forest-50 transition text-sm"
              >
                {copied === 'code' ? '✓' : 'Копі'}
              </button>
            </div>

            <label className="block text-xs font-medium text-forest-500 mb-1.5">
              Посилання-запрошення
            </label>
            <div className="flex gap-2 mb-6">
              <div className="flex-1 px-4 py-2.5 rounded-xl border border-forest-100 bg-forest-50 text-forest-700 text-sm truncate">
                {inviteLink}
              </div>
              <button
                onClick={() => copy(inviteLink, 'link')}
                className="px-4 rounded-xl border border-forest-100 text-forest-700 font-semibold hover:bg-forest-50 transition text-sm"
              >
                {copied === 'link' ? '✓' : 'Копі'}
              </button>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="w-full bg-forest-600 hover:bg-forest-700 text-white font-semibold py-2.5 rounded-xl transition"
            >
              Готово
            </button>
          </div>
        </div>
      )}
    </>
  );
}
