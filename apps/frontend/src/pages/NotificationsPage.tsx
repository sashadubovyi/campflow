import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useNotifications, useMarkRead, useMarkAllRead } from '../shared/api/notifications.hooks';
import { useAcceptInvite, useDeclineInvite, useDeferInvite } from '../shared/api/invites.hooks';
import { useAcceptJoinRequest, useRejectJoinRequest } from '../shared/api/rooms.hooks';
import { Avatar } from '../shared/ui/Avatar';
import { relativeTime } from '../shared/lib/relativeTime';
import type { NotificationItem } from '../shared/api/notifications.api';
import { BackButton, PageHeader } from '../shared/ui';
import { Mail, Check, XCircle, UserX, Crown, Clock, Bell, CheckCheck, UserPlus } from 'lucide-react';

export function NotificationsPage() {
  const { t } = useTranslation();
  const { data: notifications, isLoading } = useNotifications();
  const markAllRead = useMarkAllRead();

  const unreadCount = notifications?.filter((n) => !n.readAt).length ?? 0;

  return (
    <div className="h-full flex flex-col bg-neutral-50 font-body">
      <PageHeader
        title={<span className="font-display">{t('nav.titles.notifications')}</span>}
        left={<BackButton />}
        right={
          unreadCount > 0 ? (
            <button
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="flex items-center gap-1.5 text-xs font-semibold text-accent-600 hover:text-accent-700 px-2.5 py-1.5 rounded-lg hover:bg-accent-50 transition disabled:opacity-50"
              title={t('notifications.markAllRead')}
            >
              <CheckCheck size={14} />
              <span className="hidden md:inline">{t('notifications.markAllRead')}</span>
            </button>
          ) : undefined
        }
      />

      <main className="flex-1 overflow-y-auto max-w-2xl mx-auto w-full px-4 md:px-6 py-6">
        {isLoading && (
          <p className="text-neutral-400 text-center animate-pulse">{t('common.loading')}</p>
        )}

        {!isLoading && notifications && notifications.length === 0 && (
          <div className="bg-white rounded-2xl border border-neutral-100 border-dashed p-10 text-center flex flex-col items-center">
            <Bell size={40} className="text-neutral-300 mb-3" />
            <p className="font-display text-lg text-neutral-900 mb-1">{t('notifications.empty')}</p>
            <p className="text-neutral-400 text-sm">{t('notifications.emptyHint')}</p>
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

  if (n.kind === 'room_invite') {
    return <InviteCard n={n} isUnread={isUnread} onClick={handleClick} />;
  }
  if (n.kind === 'join_request') {
    return <JoinRequestCard n={n} isUnread={isUnread} onClick={handleClick} />;
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
  const { t } = useTranslation();
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
        isUnread && isPending ? 'border-accent-500/30 bg-accent-500/5' : 'border-neutral-100'
      } ${!isPending ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start gap-3">
        <Avatar
          fullName={payload.invitedBy.fullName}
          avatarUrl={payload.invitedBy.avatarUrl}
          size={44}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-neutral-900">
            <span className="font-semibold">{payload.invitedBy.fullName}</span>
            <span className="text-neutral-700">
              {' '}
              {t('notifications.inviteText', { name: '' }).trim()}{' '}
            </span>
            <span className="font-semibold">«{payload.roomName}»</span>
          </p>
          {payload.message && (
            <p className="text-xs text-neutral-700 mt-1.5 italic bg-neutral-50 rounded-lg px-2 py-1.5">
              «{payload.message}»
            </p>
          )}
          <p className="text-[10px] text-neutral-400 mt-1.5">{relativeTime(n.createdAt)}</p>

          {isPending && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={handleAccept}
                disabled={loading}
                className="bg-brand-gradient hover:bg-brand-gradient-hover disabled:opacity-50 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition"
              >
                {accept.isPending ? t('notifications.accepting') : t('notifications.accept')}
              </button>
              <button
                onClick={handleDefer}
                disabled={loading}
                className="bg-neutral-50 hover:bg-neutral-100 disabled:opacity-50 text-neutral-700 text-xs font-semibold px-4 py-1.5 rounded-lg transition"
              >
                {t('notifications.defer')}
              </button>
              <button
                onClick={handleDecline}
                disabled={loading}
                className="text-red-500 hover:text-red-700 disabled:opacity-50 text-xs font-semibold px-3 py-1.5 rounded-lg transition"
              >
                {t('notifications.decline')}
              </button>
            </div>
          )}

          {status === 'accepted' && (
            <p className="mt-2 text-xs text-accent-600 font-semibold">
              {t('notifications.accepted')}
            </p>
          )}
          {status === 'declined' && (
            <p className="mt-2 text-xs text-neutral-400">{t('notifications.declined')}</p>
          )}
          {status === 'cancelled' && (
            <p className="mt-2 text-xs text-neutral-400">{t('notifications.cancelled')}</p>
          )}
        </div>
      </div>
    </li>
  );
}

function JoinRequestCard({
  n,
  isUnread,
  onClick,
}: {
  n: NotificationItem;
  isUnread: boolean;
  onClick: () => void;
}) {
  const { t } = useTranslation();
  const payload = n.payload as {
    roomId: string;
    roomName: string;
    requester: { id: string; username: string; fullName: string; avatarUrl: string | null };
  };
  const accept = useAcceptJoinRequest();
  const reject = useRejectJoinRequest();
  const isDone = accept.isSuccess || reject.isSuccess;
  const status: 'pending' | 'accepted' | 'rejected' = accept.isSuccess
    ? 'accepted'
    : reject.isSuccess
      ? 'rejected'
      : 'pending';

  async function handleAccept() {
    onClick();
    await accept.mutateAsync(n.id);
  }
  function handleReject() {
    onClick();
    reject.mutate(n.id);
  }

  const loading = accept.isPending || reject.isPending;

  return (
    <li
      className={`bg-white rounded-2xl border shadow-sm p-4 transition ${
        isUnread && !isDone ? 'border-accent-500/30 bg-accent-500/5' : 'border-neutral-100'
      } ${isDone ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start gap-3">
        <Avatar
          fullName={payload.requester.fullName}
          avatarUrl={payload.requester.avatarUrl}
          size={44}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-neutral-900">
            <span className="font-semibold">{payload.requester.fullName}</span>{' '}
            <span className="text-neutral-700">
              {t('notifications.joinRequestText', 'хоче приєднатись до')}
            </span>{' '}
            <span className="font-semibold">«{payload.roomName}»</span>
          </p>
          <p className="text-[10px] text-neutral-400 mt-1.5">{relativeTime(n.createdAt)}</p>

          {status === 'pending' && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleAccept}
                disabled={loading}
                className="bg-brand-gradient hover:bg-brand-gradient-hover disabled:opacity-50 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition"
              >
                {accept.isPending ? t('notifications.accepting') : t('notifications.accept')}
              </button>
              <button
                onClick={handleReject}
                disabled={loading}
                className="text-red-500 hover:text-red-700 disabled:opacity-50 text-xs font-semibold px-3 py-1.5 rounded-lg transition"
              >
                {t('notifications.reject', 'Відхилити')}
              </button>
            </div>
          )}
          {status === 'accepted' && (
            <p className="mt-2 text-xs text-accent-600 font-semibold">
              {t('notifications.joinAccepted', 'Прийнято')}
            </p>
          )}
          {status === 'rejected' && (
            <p className="mt-2 text-xs text-neutral-400">
              {t('notifications.joinRejected', 'Відхилено')}
            </p>
          )}
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
  const text = useTextForKind(n);
  return (
    <li
      onClick={onClick}
      className={`bg-white rounded-2xl border shadow-sm p-4 cursor-pointer transition ${
        isUnread ? 'border-accent-500/30 bg-accent-500/5' : 'border-neutral-100'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-neutral-50 flex items-center justify-center text-lg shrink-0">
          {iconForKind(n.kind)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-neutral-900">{text}</p>
          <p className="text-[10px] text-neutral-400 mt-1">{relativeTime(n.createdAt)}</p>
        </div>
      </div>
    </li>
  );
}

function iconForKind(kind: NotificationItem['kind']) {
  const map: Partial<Record<NotificationItem['kind'], React.ReactNode>> = {
    room_invite: <Mail size={18} className="text-neutral-500" />,
    room_invite_accepted: (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-neutral-100">
        <Check size={12} strokeWidth={3} className="text-neutral-500" />
      </span>
    ),
    room_invite_declined: <XCircle size={18} className="text-red-400" />,
    join_request: <UserPlus size={18} className="text-accent-600" />,
    join_request_accepted: (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-neutral-100">
        <Check size={12} strokeWidth={3} className="text-neutral-500" />
      </span>
    ),
    join_request_rejected: <XCircle size={18} className="text-red-400" />,
    member_removed: <UserX size={18} className="text-neutral-500" />,
    room_admin_transferred: <Crown size={18} className="text-amber-500" />,
    room_deletion_warning: <Clock size={18} className="text-orange-400" />,
    system: <Bell size={18} className="text-neutral-500" />,
  };
  return map[kind] ?? <Bell size={18} className="text-neutral-500" />;
}

function useTextForKind(n: NotificationItem): string {
  const { t } = useTranslation();
  const p = n.payload as { roomName?: string };
  const room = p.roomName ?? '…';
  switch (n.kind) {
    case 'room_invite_accepted':
      return t('notifications.kinds.inviteAccepted', { room });
    case 'room_invite_declined':
      return t('notifications.kinds.inviteDeclined', { room });
    case 'join_request_accepted':
      return t('notifications.kinds.joinAccepted', { room, defaultValue: `Ваш запит на «${room}» прийнято` });
    case 'join_request_rejected':
      return t('notifications.kinds.joinRejected', { room, defaultValue: `Ваш запит на «${room}» відхилено` });
    case 'member_removed':
      return t('notifications.kinds.memberRemoved', { room });
    case 'room_admin_transferred':
      return t('notifications.kinds.adminTransferred', { room });
    case 'room_deletion_warning':
      return t('notifications.kinds.deletionWarning', { room });
    default:
      return t('notifications.kinds.system');
  }
}
