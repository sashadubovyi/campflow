import type { RoomMember } from '../../shared/api/rooms.api';
import { Avatar } from '../../shared/ui/Avatar';

interface Props {
  members: RoomMember[];
  currentUserId: string;
}

export function MembersPanel({ members, currentUserId }: Props) {
  const admins = members.filter((m) => m.role === 'admin');
  const regular = members.filter((m) => m.role === 'member');

  return (
    <aside className="h-full bg-white border-r border-forest-100 flex flex-col">
      <div className="px-4 py-4 border-b border-forest-100">
        <h2 className="font-display text-sm uppercase tracking-widest text-forest-500">Учасники</h2>
        <p className="font-body text-xs text-forest-700 mt-0.5">{members.length} осіб</p>
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
            <Avatar fullName={m.user.fullName} avatarUrl={m.user.avatarUrl} size={32} />
            <div className="min-w-0">
              <p className="font-body text-sm text-forest-900 truncate">
                {m.user.fullName}
                {m.user.id === currentUserId && (
                  <span className="text-forest-500 text-xs"> (ви)</span>
                )}
              </p>
              {m.role === 'admin' && <p className="font-body text-xs text-ember-500">Адмін</p>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
