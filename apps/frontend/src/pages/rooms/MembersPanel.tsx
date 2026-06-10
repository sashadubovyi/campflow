import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogOut } from 'lucide-react';
import type { RoomMember } from '../../shared/api/rooms.api';
import { Avatar } from '../../shared/ui/Avatar';
import { relativeTime } from '../../shared/lib/relativeTime';
import {
  useLeaveRoom,
  useRemoveMember,
  useTransferAdmin,
} from '../../shared/api/rooms-actions.hooks';

interface Props {
  roomId: string;
  members: RoomMember[];
  currentUserId: string;
  isAdmin: boolean;
}

export function MembersPanel({ roomId, members, currentUserId, isAdmin }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const leave = useLeaveRoom();
  const remove = useRemoveMember();

  // Захист: при першому рендері (поки room ще завантажується) або при
  // помилках API members може прийти undefined — інакше .filter() кидає.
  const safeMembers: RoomMember[] = members ?? [];

  const sortMembers = (arr: RoomMember[]) =>
    [...arr].sort((a, b) => {
      if (a.user.isOnline !== b.user.isOnline) return a.user.isOnline ? -1 : 1;
      return a.user.fullName.localeCompare(b.user.fullName);
    });

  const admins = sortMembers(safeMembers.filter((m) => m.role === 'admin'));
  const regular = sortMembers(safeMembers.filter((m) => m.role === 'member'));
  const onlineCount = safeMembers.filter((m) => m.user.isOnline).length;

  const adminCount = admins.length;
  const myMembership = safeMembers.find((m) => m.user.id === currentUserId);
  const iAmLastAdmin =
    myMembership?.role === 'admin' && adminCount === 1 && safeMembers.length > 1;

  function openProfile(username: string) {
    navigate(`/u/${username}`);
  }

  async function handleLeave() {
    if (iAmLastAdmin) {
      setTransferModalOpen(true);
      return;
    }
    if (!confirm(t('rooms.confirmLeave'))) return;
    const result = await leave.mutateAsync(roomId);
    if (result.deleted) {
      alert(t('rooms.empty'));
    }
    navigate('/rooms');
  }

  async function handleRemove(memberId: string, name: string) {
    if (!confirm(t('rooms.confirmRemove', { name }))) return;
    await remove.mutateAsync({ roomId, memberId });
  }

  return (
    <>
      <aside className="h-full bg-white/55 backdrop-blur-xl flex flex-col min-h-0">
        <div className="px-4 py-4 border-b border-white/30 shrink-0">
          <h2 className="text-sm uppercase tracking-widest text-neutral-400">
            {t('rooms.members')}
          </h2>
          <p className="text-xs text-neutral-600 mt-0.5">
            {t('rooms.membersCount', { count: safeMembers.length })}
            {onlineCount > 0 && (
              <span className="text-neutral-400">
                {' · '}
                {onlineCount} {t('rooms.online')}
              </span>
            )}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin px-2 py-3 space-y-4">
          {admins.length > 0 && (
            <MemberGroup
              title={t('rooms.admin') + 'и'}
              members={admins}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onOpen={openProfile}
              onRemove={handleRemove}
            />
          )}
          {regular.length > 0 && (
            <MemberGroup
              title={t('rooms.members')}
              members={regular}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onOpen={openProfile}
              onRemove={handleRemove}
            />
          )}
        </div>

        <div className="border-t border-neutral-100 p-3 shrink-0">
          <button
            onClick={handleLeave}
            disabled={leave.isPending}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-red-500 hover:bg-red-50 disabled:opacity-50 font-semibold py-2 rounded-lg transition"
          >
            <LogOut size={14} />
            {t('rooms.leaveRoom')}
          </button>
        </div>
      </aside>

      {transferModalOpen && (
        <TransferAdminModal
          roomId={roomId}
          members={members}
          currentUserId={currentUserId}
          onClose={() => setTransferModalOpen(false)}
          onTransferred={async () => {
            setTransferModalOpen(false);
            const result = await leave.mutateAsync(roomId);
            if (result.deleted) {
              alert(t('rooms.empty'));
            }
            navigate('/rooms');
          }}
        />
      )}
    </>
  );
}

function MemberGroup({
  title,
  members,
  currentUserId,
  isAdmin,
  onOpen,
  onRemove,
}: {
  title: string;
  members: RoomMember[];
  currentUserId: string;
  isAdmin: boolean;
  onOpen: (username: string) => void;
  onRemove: (memberId: string, name: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <div>
      <p className="text-xs font-medium text-neutral-400 px-2 mb-1.5">{title}</p>
      <ul className="space-y-0.5">
        {members.map((m) => {
          const isSelf = m.user.id === currentUserId;
          const canRemove = isAdmin && !isSelf;
          return (
            <li key={m.id} className="group flex items-center gap-1">
              <button
                type="button"
                onClick={() => onOpen(m.user.username)}
                className="flex-1 flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-white/50 transition text-left min-w-0 rounded-xl"
              >
                <Avatar
                  fullName={m.user.fullName}
                  avatarUrl={m.user.avatarUrl}
                  size={32}
                  isOnline={m.user.isOnline}
                  showStatus
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm truncate ${
                      m.user.isOnline ? 'text-neutral-900' : 'text-neutral-600'
                    }`}
                  >
                    {m.user.fullName}
                    {isSelf && (
                      <span className="text-neutral-400 text-xs"> ({t('common.you')})</span>
                    )}
                  </p>
                  {m.role === 'admin' && !m.user.isOnline && (
                    <p className="text-[10px] text-accent-600">{t('rooms.admin')}</p>
                  )}
                  {m.role === 'admin' && m.user.isOnline && (
                    <p className="text-[10px] text-accent-600">{t('rooms.adminOnline')}</p>
                  )}
                  {m.role !== 'admin' && !m.user.isOnline && (
                    <p className="text-[10px] text-neutral-400">
                      {t('rooms.wasOnline', { time: relativeTime(m.user.lastSeenAt) })}
                    </p>
                  )}
                  {m.role !== 'admin' && m.user.isOnline && (
                    <p className="text-[10px] text-success-700">{t('rooms.online')}</p>
                  )}
                </div>
              </button>
              {canRemove && (
                <button
                  onClick={() => onRemove(m.id, m.user.fullName)}
                  className="opacity-0 group-hover:opacity-100 transition text-red-500 hover:bg-red-50 px-2 py-1 rounded text-xs"
                  title={t('common.remove')}
                >
                  ✕
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function TransferAdminModal({
  roomId,
  members,
  currentUserId,
  onClose,
  onTransferred,
}: {
  roomId: string;
  members: RoomMember[];
  currentUserId: string;
  onClose: () => void;
  onTransferred: () => void;
}) {
  const { t } = useTranslation();
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const transfer = useTransferAdmin();

  const candidates = members
    .filter((m) => m.user.id !== currentUserId)
    .sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime());

  async function handleConfirm() {
    const target = selectedMemberId ?? candidates[0]?.id;
    if (!target) return;
    await transfer.mutateAsync({ roomId, memberId: target });
    onTransferred();
  }

  return (
    <div
      className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm flex items-center justify-center px-4 z-50"
      onClick={onClose}
    >
      <div
        className="glass-surface rounded-2xl shadow-2xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-neutral-900 mb-1">{t('rooms.transferAdmin')}</h2>
        <p className="text-sm text-neutral-600 mb-5">{t('rooms.transferAdminDescription')}</p>

        <ul className="space-y-1 mb-4 max-h-60 overflow-y-auto scrollbar-thin">
          {candidates.map((m, idx) => (
            <li key={m.id}>
              <button
                onClick={() => setSelectedMemberId(m.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl border-2 transition ${
                  (selectedMemberId ?? candidates[0]?.id) === m.id
                    ? 'border-accent-500 bg-accent-50'
                    : 'border-neutral-200 hover:border-accent-500/50'
                }`}
              >
                <Avatar fullName={m.user.fullName} avatarUrl={m.user.avatarUrl} size={32} />
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-sm font-semibold text-neutral-900 truncate">
                    {m.user.fullName}
                    {idx === 0 && (
                      <span className="text-neutral-400 text-xs font-normal ml-1">
                        {t('rooms.defaultChoice')}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-neutral-400">@{m.user.username}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>

        <p className="text-xs text-neutral-400 mb-4 italic">{t('rooms.transferHint')}</p>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 glass-btn py-2.5"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleConfirm}
            disabled={transfer.isPending}
            className="flex-1 btn-glass-blue disabled:opacity-60 font-semibold py-2.5 rounded-2xl transition"
          >
            {transfer.isPending ? t('rooms.transferring') : t('rooms.transferAndLeave')}
          </button>
        </div>
      </div>
    </div>
  );
}
