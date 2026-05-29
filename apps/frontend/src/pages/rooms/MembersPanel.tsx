import type { RoomMember } from '../../shared/api/rooms.api';
import { Avatar } from '../../shared/ui/Avatar';
import { relativeTime } from '../../shared/lib/relativeTime';

interface Props {
  members: RoomMember[];
  currentUserId: string;
}

export function MembersPanel({ members, currentUserId }: Props) {
  // Сортуємо: онлайн нагору, в межах груп — за іменем
  const sortMembers = (arr: RoomMember[]) =>
    [...arr].sort((a, b) => {
      if (a.user.isOnline !== b.user.isOnline) return a.user.isOnline ? -1 : 1;
      return a.user.fullName.localeCompare(b.user.fullName);
    });

  const admins = sortMembers(members.filter((m) => m.role === 'admin'));
  const regular = sortMembers(members.filter((m) => m.role === 'member'));

  const onlineCount = members.filter((m) => m.user.isOnline).length;

  return (
    <aside className="h-full bg-white border-r border-forest-100 flex flex-col">
      <div className="px-4 py-4 border-b border-forest-100">
        <h2 className="font-display text-sm uppercase tracking-widest text-forest-500">Учасники</h2>
        <p className="font-body text-xs text-forest-700 mt-0.5">
          {members.length} осіб
          {onlineCount > 0 && <span className="text-forest-500"> · {onlineCount} онлайн</span>}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {admins.length > 0 && (
          <MemberGroup title="Адміністратори" members={admins} currentUserId={currentUserId} />
        )}
        {regular.length > 0 && (
          <MemberGroup title="Учасники" members={regular} currentUserId={currentUserId} />
        )}
      </div>
    </aside>
  );
}

function MemberGroup({
  title,
  members,
  currentUserId,
}: {
  title: string;
  members: RoomMember[];
  currentUserId: string;
}) {
  return (
    <div>
      <p className="font-body text-xs font-medium text-forest-500 px-2 mb-1.5">{title}</p>
      <ul className="space-y-0.5">
        {members.map((m) => (
          <li
            key={m.id}
            className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-forest-50 transition"
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
                {m.user.id === currentUserId && (
                  <span className="text-forest-500 text-xs"> (ви)</span>
                )}
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
          </li>
        ))}
      </ul>
    </div>
  );
}
