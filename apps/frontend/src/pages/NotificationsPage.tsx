import { useNavigate } from 'react-router-dom';
import { useNotifications, useMarkRead, useMarkAllRead } from '../shared/api/notifications.hooks';
import { useAcceptInvite, useDeclineInvite, useDeferInvite } from '../shared/api/invites.hooks';
import { Avatar } from '../shared/ui/Avatar';
import { relativeTime } from '../shared/lib/relativeTime';
import type { NotificationItem } from '../shared/api/notifications.api';

export function NotificationsPage() {
  const navigate = useNavigate();
  const { data: notifications, isLoading } = useNotifications();
  const markAllRead = useMarkAllRead();

  const unreadCount = notifications?.filter((n) => !n.readAt).length ?? 0;

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
          <span className="font-display text-lg font-bold text-forest-900">Сповіщення</span>
          {unreadCount > 0 ? (
            <button
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="text-xs text-forest-600 hover:text-forest-900 font-medium"
            >
              Прочитати все
            </button>
          ) : (
            <span className="w-20" />
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-6">
        {isLoading && <p className="text-forest-500 text-center animate-pulse">Завантаження…</p>}

        {!isLoading && notifications && notifications.length === 0 && (
          <div className="bg-white rounded-2xl border border-forest-100 border-dashed p-10 text-center">
            <p className="text-3xl mb-3">🔔</p>
            <p className="font-display text-lg text-forest-900 mb-1">Сповіщень поки немає</p>
            <p className="text-forest-700 text-sm">
              Тут з'являтимуться запрошення в кімнати та інші важливі події.
            </p>
          </div>
        )}

        {notifications && notifications.length > 0 && (
          <ul className="space-y-3">
            {notifications.map((n) => (
              <NotificationCard key={n.id} n={n} />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function NotificationCard({ n }: { n: NotificationItem }) {
  const markRead = useMarkRead();
  const isUnread = !n.readAt;

  function handleClick() {
    if (isUnread) markRead.mutate(n.id);
  }

  // Залежно від типу — різний рендер
  if (n.kind === 'room_invite') {
    return <InviteCard n={n} isUnread={isUnread} onClick={handleClick} />;
  }

  return <SystemCard n={n} isUnread={isUnread} onClick={handleClick} />;
}

function InviteCard({
  n,
  isUnread,
  onClick,
}: {
  n: NotificationItem;
  isUnread: boolean;
  onClick: () => void;
}) {
  const payload = n.payload as {
    inviteId: string;
    roomId: string;
    roomName: string;
    message: string | null;
    invitedBy: {
      id: string;
      username: string;
      fullName: string;
      avatarUrl: string | null;
    };
    currentStatus?: 'pending' | 'accepted' | 'declined' | 'deferred' | 'cancelled';
  };

  const accept = useAcceptInvite();
  const decline = useDeclineInvite();
  const defer = useDeferInvite();
  const navigate = useNavigate();

  // Стан інвайта — або з мутації, або з бекенду
  const status = accept.isSuccess
    ? 'accepted'
    : decline.isSuccess
      ? 'declined'
      : (payload.currentStatus ?? 'pending');

  const isPending = status === 'pending' || status === 'deferred';

  async function handleAccept() {
    onClick();
    const result = await accept.mutateAsync(payload.inviteId);
    navigate(`/rooms/${result.roomId}`);
  }

  function handleDecline() {
    onClick();
    decline.mutate(payload.inviteId);
  }

  function handleDefer() {
    onClick();
    defer.mutate(payload.inviteId);
  }

  const loading = accept.isPending || decline.isPending || defer.isPending;

  return (
    <li
      className={`bg-white rounded-2xl border shadow-sm p-4 transition ${
        isUnread && isPending ? 'border-ember-500/30 bg-ember-500/5' : 'border-forest-100'
      } ${!isPending ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start gap-3">
        <Avatar
          fullName={payload.invitedBy.fullName}
          avatarUrl={payload.invitedBy.avatarUrl}
          size={44}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-forest-900">
            <span className="font-semibold">{payload.invitedBy.fullName}</span>
            <span className="text-forest-700"> запросив тебе в </span>
            <span className="font-semibold">«{payload.roomName}»</span>
          </p>
          {payload.message && (
            <p className="text-xs text-forest-700 mt-1.5 italic bg-forest-50 rounded-lg px-2 py-1.5">
              «{payload.message}»
            </p>
          )}
          <p className="text-[10px] text-forest-500 mt-1.5">{relativeTime(n.createdAt)}</p>

          {isPending && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={handleAccept}
                disabled={loading}
                className="bg-forest-600 hover:bg-forest-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition"
              >
                {accept.isPending ? 'Приймаю…' : '✓ Прийняти'}
              </button>
              <button
                onClick={handleDefer}
                disabled={loading}
                className="bg-forest-50 hover:bg-forest-100 disabled:opacity-50 text-forest-700 text-xs font-semibold px-4 py-1.5 rounded-lg transition"
              >
                Пізніше
              </button>
              <button
                onClick={handleDecline}
                disabled={loading}
                className="text-red-500 hover:text-red-700 disabled:opacity-50 text-xs font-semibold px-3 py-1.5 rounded-lg transition"
              >
                Відмовитись
              </button>
            </div>
          )}

          {status === 'accepted' && (
            <p className="mt-2 text-xs text-forest-600 font-semibold">✓ Прийнято</p>
          )}
          {status === 'declined' && <p className="mt-2 text-xs text-forest-500">✕ Відмовлено</p>}
          {status === 'cancelled' && <p className="mt-2 text-xs text-forest-500">⊘ Скасовано</p>}
        </div>
      </div>
    </li>
  );
}

function SystemCard({
  n,
  isUnread,
  onClick,
}: {
  n: NotificationItem;
  isUnread: boolean;
  onClick: () => void;
}) {
  const text = textForKind(n);
  return (
    <li
      onClick={onClick}
      className={`bg-white rounded-2xl border shadow-sm p-4 cursor-pointer transition ${
        isUnread ? 'border-ember-500/30 bg-ember-500/5' : 'border-forest-100'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-forest-50 flex items-center justify-center text-lg shrink-0">
          {iconForKind(n.kind)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-forest-900">{text}</p>
          <p className="text-[10px] text-forest-500 mt-1">{relativeTime(n.createdAt)}</p>
        </div>
      </div>
    </li>
  );
}

function iconForKind(kind: NotificationItem['kind']): string {
  const map: Record<NotificationItem['kind'], string> = {
    room_invite: '📩',
    room_invite_accepted: '✅',
    room_invite_declined: '❌',
    member_removed: '🚪',
    room_admin_transferred: '👑',
    room_deletion_warning: '⏰',
    system: '🔔',
  };
  return map[kind] ?? '🔔';
}

function textForKind(n: NotificationItem): string {
  const p = n.payload as { roomName?: string };
  switch (n.kind) {
    case 'room_invite_accepted':
      return `Запрошення в «${p.roomName ?? 'кімнату'}» прийнято`;
    case 'room_invite_declined':
      return `Запрошення в «${p.roomName ?? 'кімнату'}» не прийнято`;
    case 'member_removed':
      return `Вас видалено з кімнати «${p.roomName ?? '...'}»`;
    case 'room_admin_transferred':
      return `Вас призначено адміністратором кімнати «${p.roomName ?? '...'}»`;
    case 'room_deletion_warning':
      return `Кімната «${p.roomName ?? '...'}» скоро буде видалена`;
    default:
      return 'Системне сповіщення';
  }
}
