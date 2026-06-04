import { useTranslation } from 'react-i18next';
import { Users, Calendar } from 'lucide-react';
import type { RoomListItem } from '../../shared/api/rooms.api';
import { Avatar } from '../../shared/ui';
import { relativeTime } from '../../shared/lib/relativeTime';

interface RoomCardProps {
  room: RoomListItem;
  onOpen: (id: string) => void;
}

export function RoomCard({ room, onOpen }: RoomCardProps) {
  const { i18n } = useTranslation();

  return (
    <button
      onClick={() => onOpen(room.id)}
      className="text-left w-full bg-white rounded-card shadow-card hover:shadow-card-lg transition-all duration-200 overflow-hidden group"
    >
      {/* Рядок адміна */}
      <div className="flex items-center gap-2.5 px-3 pt-3 pb-2">
        {room.admin ? (
          <Avatar
            fullName={room.admin.fullName}
            avatarUrl={room.admin.avatarUrl}
            size={32}
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-neutral-200 shrink-0" />
        )}
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-sm font-semibold text-neutral-900 truncate leading-tight">
            {room.name}
          </span>
          {room.description && (
            <span className="text-xs text-neutral-400 truncate leading-tight mt-0.5">
              {room.description}
            </span>
          )}
        </div>
      </div>

      {/* Обкладинка */}
      <div className="relative w-full aspect-[16/7] overflow-hidden">
        <img
          src={room.coverUrl ?? '/room-cover-placeholder.jpeg'}
          alt={room.name}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
        />

        {/* Темний градієнт знизу */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {/* Мета: дата + учасники */}
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-2 pt-6 flex items-end justify-between">
          <span className="text-white/70 text-xs">
            {relativeTime(room.createdAt)}
          </span>
          <span className="flex items-center gap-1 text-white/70 text-xs">
            <Users size={11} />
            {room.memberCount}
          </span>
        </div>
      </div>
    </button>
  );
}
