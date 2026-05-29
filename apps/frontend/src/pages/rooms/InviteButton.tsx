import { useEffect, useState } from 'react';
import { invitesApi, type CanInviteResult } from '../../shared/api/invites.api';
import { useCreateInvite } from '../../shared/api/invites.hooks';
import { Avatar } from '../../shared/ui/Avatar';

interface Props {
  roomId: string;
  inviteCode: string;
}

type Tab = 'username' | 'link';

export function InviteButton({ roomId, inviteCode }: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('username');
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  const inviteLink = `${window.location.origin}/join/${inviteCode}`;

  async function copy(value: string, what: 'code' | 'link') {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(what);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // clipboard може бути недоступний
    }
  }

  function handleClose() {
    setOpen(false);
    setTab('username');
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
          onClick={handleClose}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 font-body"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-xl font-bold text-forest-900 mb-1">
              Запросити учасників
            </h2>
            <p className="text-sm text-forest-700 mb-4">
              Знайдіть людину за username або поділіться посиланням.
            </p>

            {/* Вкладки */}
            <div className="flex gap-1 mb-5 bg-forest-50 p-1 rounded-xl">
              <button
                onClick={() => setTab('username')}
                className={`flex-1 text-sm font-semibold py-2 rounded-lg transition ${
                  tab === 'username'
                    ? 'bg-white text-forest-900 shadow-sm'
                    : 'text-forest-700 hover:text-forest-900'
                }`}
              >
                👤 По username
              </button>
              <button
                onClick={() => setTab('link')}
                className={`flex-1 text-sm font-semibold py-2 rounded-lg transition ${
                  tab === 'link'
                    ? 'bg-white text-forest-900 shadow-sm'
                    : 'text-forest-700 hover:text-forest-900'
                }`}
              >
                🔗 Посилання
              </button>
            </div>

            {tab === 'username' ? (
              <InviteByUsername roomId={roomId} onDone={handleClose} />
            ) : (
              <InviteByLink
                inviteCode={inviteCode}
                inviteLink={inviteLink}
                copied={copied}
                onCopy={copy}
                onClose={handleClose}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}

// === Вкладка 1: запросити по username ===

function InviteByUsername({ roomId, onDone }: { roomId: string; onDone: () => void }) {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [check, setCheck] = useState<CanInviteResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [sent, setSent] = useState(false);
  const create = useCreateInvite();

  // Debounce-перевірка можливості запросити (через 500мс після останнього вводу)
  useEffect(() => {
    if (!username || username.length < 2) {
      setCheck(null);
      return;
    }
    const handle = setTimeout(async () => {
      setChecking(true);
      try {
        const result = await invitesApi.canInvite(roomId, username.trim());
        setCheck(result);
      } catch {
        setCheck(null);
      } finally {
        setChecking(false);
      }
    }, 500);
    return () => clearTimeout(handle);
  }, [username, roomId]);

  async function handleSend() {
    if (!check?.allowed) return;
    try {
      await create.mutateAsync({
        roomId,
        username: username.trim(),
        message: message.trim() || undefined,
      });
      setSent(true);
      setTimeout(onDone, 1500);
    } catch {
      // помилка через мутацію
    }
  }

  const reasonLabels: Record<string, string> = {
    not_found: 'Користувача з таким username не знайдено',
    self: 'Не можна запросити самого себе',
    already_member: 'Цей користувач вже в кімнаті',
    already_invited: 'Запрошення вже надіслано',
    blocked_by_policy: 'Користувач заборонив надсилати йому запрошення',
  };

  if (sent) {
    return (
      <div className="bg-forest-50 rounded-xl p-6 text-center">
        <p className="text-3xl mb-2">📬</p>
        <p className="font-semibold text-forest-900">Запрошення надіслано!</p>
        <p className="text-xs text-forest-700 mt-1">{check?.target?.fullName} отримає сповіщення</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-forest-700 mb-1.5">Username</label>
        <div className="flex items-center gap-1">
          <span className="text-forest-500 font-mono">@</span>
          <input
            value={username}
            onChange={(e) => {
              setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
              setCheck(null);
            }}
            placeholder="ivan_petrenko"
            className="flex-1 px-3 py-2 rounded-lg border border-forest-100 focus:border-forest-500 outline-none text-sm font-mono"
            autoFocus
          />
        </div>
      </div>

      {/* Результат перевірки */}
      {checking && <p className="text-xs text-forest-500 italic">Перевіряємо…</p>}

      {check && !checking && (
        <div
          className={`rounded-xl p-3 ${
            check.allowed
              ? 'bg-forest-50 border border-forest-500/30'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          {check.allowed && check.target ? (
            <div className="flex items-center gap-3">
              <Avatar
                fullName={check.target.fullName}
                avatarUrl={check.target.avatarUrl}
                size={36}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-forest-900 truncate">
                  {check.target.fullName}
                </p>
                <p className="text-xs text-forest-500">@{check.target.username}</p>
              </div>
              <span className="text-forest-600 text-xs font-semibold">✓ Можна</span>
            </div>
          ) : (
            <p className="text-xs text-red-700">
              {reasonLabels[check.reason ?? ''] ?? 'Не можна запросити'}
            </p>
          )}
        </div>
      )}

      {/* Повідомлення (необов'язкове) */}
      <div>
        <label className="block text-xs font-medium text-forest-700 mb-1.5">
          Повідомлення <span className="text-forest-500 font-normal">(необов'язково)</span>
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder="Привіт! Приєднуйся до нашої поїздки 🏕️"
          className="w-full px-3 py-2 rounded-lg border border-forest-100 focus:border-forest-500 outline-none text-sm resize-none"
        />
      </div>

      {/* Кнопка */}
      <button
        onClick={handleSend}
        disabled={!check?.allowed || create.isPending}
        className="w-full bg-forest-600 hover:bg-forest-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition text-sm"
      >
        {create.isPending ? 'Надсилаю…' : 'Надіслати запрошення'}
      </button>
    </div>
  );
}

// === Вкладка 2: запросити за посиланням ===

function InviteByLink({
  inviteCode,
  inviteLink,
  copied,
  onCopy,
  onClose,
}: {
  inviteCode: string;
  inviteLink: string;
  copied: 'code' | 'link' | null;
  onCopy: (value: string, what: 'code' | 'link') => void;
  onClose: () => void;
}) {
  return (
    <>
      <label className="block text-xs font-medium text-forest-500 mb-1.5">Код запрошення</label>
      <div className="flex gap-2 mb-4">
        <div className="flex-1 px-4 py-2.5 rounded-xl border border-forest-100 bg-forest-50 font-mono tracking-widest text-forest-900 text-center">
          {inviteCode}
        </div>
        <button
          onClick={() => onCopy(inviteCode, 'code')}
          className="px-4 rounded-xl border border-forest-100 text-forest-700 font-semibold hover:bg-forest-50 transition text-sm"
        >
          {copied === 'code' ? '✓' : 'Копі'}
        </button>
      </div>

      <label className="block text-xs font-medium text-forest-500 mb-1.5">
        Посилання-запрошення
      </label>
      <div className="flex gap-2 mb-5">
        <div className="flex-1 px-4 py-2.5 rounded-xl border border-forest-100 bg-forest-50 text-forest-700 text-sm truncate">
          {inviteLink}
        </div>
        <button
          onClick={() => onCopy(inviteLink, 'link')}
          className="px-4 rounded-xl border border-forest-100 text-forest-700 font-semibold hover:bg-forest-50 transition text-sm"
        >
          {copied === 'link' ? '✓' : 'Копі'}
        </button>
      </div>

      <button
        onClick={onClose}
        className="w-full bg-forest-600 hover:bg-forest-700 text-white font-semibold py-2.5 rounded-xl transition"
      >
        Готово
      </button>
    </>
  );
}
