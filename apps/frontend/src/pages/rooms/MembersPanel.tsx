import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const leave = useLeaveRoom();
  const remove = useRemoveMember();

  const sortMembers = (arr: RoomMember[]) =>
    [...arr].sort((a, b) => {
      if (a.user.isOnline !== b.user.isOnline) return a.user.isOnline ? -1 : 1;
      return a.user.fullName.localeCompare(b.user.fullName);
    });

  const admins = sortMembers(members.filter((m) => m.role === 'admin'));
  const regular = sortMembers(members.filter((m) => m.role === 'member'));
  const onlineCount = members.filter((m) => m.user.isOnline).length;

  const adminCount = members.filter((m) => m.role === 'admin').length;
  const myMembership = members.find((m) => m.user.id === currentUserId);
  const iAmLastAdmin = myMembership?.role === 'admin' && adminCount === 1 && members.length > 1;

  function openProfile(username: string) {
    navigate(`/u/${username}`);
  }

  async function handleLeave() {
    if (iAmLastAdmin) {
      setTransferModalOpen(true);
      return;
    }
    if (!confirm('Дійсно вийти з кімнати?')) return;
    const result = await leave.mutateAsync(roomId);
    if (result.deleted) {
      alert('Кімнату видалено (ви були останнім учасником).');
    }
    navigate('/rooms');
  }

  async function handleRemove(memberId: string, name: string) {
    if (!confirm(`Видалити ${name} з кімнати?`)) return;
    await remove.mutateAsync({ roomId, memberId });
  }

  return (
    <>
      <aside className="h-full bg-white border-r border-forest-100 flex flex-col">
        <div className="px-4 py-4 border-b border-forest-100">
          <h2 className="font-display text-sm uppercase tracking-widest text-forest-500">
            Учасники
          </h2>
          <p className="font-body text-xs text-forest-700 mt-0.5">
            {members.length} осіб
            {onlineCount > 0 && <span className="text-forest-500"> · {onlineCount} онлайн</span>}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          {admins.length > 0 && (
            <MemberGroup
              title="Адміністратори"
              members={admins}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onOpen={openProfile}
              onRemove={handleRemove}
            />
          )}
          {regular.length > 0 && (
            <MemberGroup
              title="Учасники"
              members={regular}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onOpen={openProfile}
              onRemove={handleRemove}
            />
          )}
        </div>

        <div className="border-t border-forest-100 p-3">
          <button
            onClick={handleLeave}
            disabled={leave.isPending}
            className="w-full text-xs text-red-500 hover:bg-red-50 disabled:opacity-50 font-semibold py-2 rounded-lg transition"
          >
            ↩ Вийти з кімнати
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
              alert('Кімнату видалено.');
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
  return (
    <div>
      <p className="font-body text-xs font-medium text-forest-500 px-2 mb-1.5">{title}</p>
      <ul className="space-y-0.5">
        {members.map((m) => {
          const isSelf = m.user.id === currentUserId;
          const canRemove = isAdmin && !isSelf;
          return (
            <li key={m.id} className="group flex items-center gap-1">
              <button
                type="button"
                onClick={() => onOpen(m.user.username)}
                className="flex-1 flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-forest-50 transition text-left min-w-0"
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
                    className={`font-body text-sm truncate ${
                      m.user.isOnline ? 'text-forest-900' : 'text-forest-700'
                    }`}
                  >
                    {m.user.fullName}
                    {isSelf && <span className="text-forest-500 text-xs"> (ви)</span>}
                  </p>
                  {m.role === 'admin' && !m.user.isOnline && (
                    <p className="font-body text-[10px] text-ember-500">Адмін</p>
                  )}
                  {m.role === 'admin' && m.user.isOnline && (
                    <p className="font-body text-[10px] text-ember-500">Адмін · онлайн</p>
                  )}
                  {m.role !== 'admin' && !m.user.isOnline && (
                    <p className="font-body text-[10px] text-forest-500">
                      був(-ла) {relativeTime(m.user.lastSeenAt)}
                    </p>
                  )}
                  {m.role !== 'admin' && m.user.isOnline && (
                    <p className="font-body text-[10px] text-forest-500">онлайн</p>
                  )}
                </div>
              </button>
              {canRemove && (
                <button
                  onClick={() => onRemove(m.id, m.user.fullName)}
                  className="opacity-0 group-hover:opacity-100 transition text-red-500 hover:bg-red-50 px-2 py-1 rounded text-xs"
                  title="Видалити з кімнати"
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

// === Модалка передачі прав адміна ===

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
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const transfer = useTransferAdmin();

  // Кандидати — всі учасники крім мене, сортуємо за давністю
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
      className="fixed inset-0 bg-forest-900/40 flex items-center justify-center px-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 font-body"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-lg font-bold text-forest-900 mb-1">
          Передати права адміна
        </h2>
        <p className="text-sm text-forest-700 mb-5">
          Ви — останній адміністратор. Оберіть, кому передати права, перш ніж вийти.
        </p>

        <ul className="space-y-1 mb-4 max-h-60 overflow-y-auto">
          {candidates.map((m, idx) => (
            <li key={m.id}>
              <button
                onClick={() => setSelectedMemberId(m.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border-2 transition ${
                  (selectedMemberId ?? candidates[0]?.id) === m.id
                    ? 'border-forest-500 bg-forest-50'
                    : 'border-forest-100 hover:border-forest-500/50'
                }`}
              >
                <Avatar fullName={m.user.fullName} avatarUrl={m.user.avatarUrl} size={32} />
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-sm font-semibold text-forest-900 truncate">
                    {m.user.fullName}
                    {idx === 0 && (
                      <span className="text-forest-500 text-xs font-normal ml-1">
                        (за замовчуванням)
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-forest-500">@{m.user.username}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>

        <p className="text-xs text-forest-500 mb-4 italic">
          💡 Якщо не оберете — права передадуться найдавнішому учаснику.
        </p>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 border border-forest-100 text-forest-700 font-semibold py-2.5 rounded-xl hover:bg-forest-50 transition"
          >
            Скасувати
          </button>
          <button
            onClick={handleConfirm}
            disabled={transfer.isPending}
            className="flex-1 bg-forest-600 hover:bg-forest-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition"
          >
            {transfer.isPending ? 'Передаю…' : 'Передати і вийти'}
          </button>
        </div>
      </div>
    </div>
  );
}
