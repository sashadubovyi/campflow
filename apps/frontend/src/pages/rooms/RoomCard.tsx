import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react';
import { motion } from 'framer-motion';
import type { RoomListItem } from '../../shared/api/rooms.api';
import { Avatar } from '../../shared/ui';
import { getMediaUrl } from '../../shared/lib/getMediaUrl';
import { relativeTime } from '../../shared/lib/relativeTime';

interface RoomCardProps {
  room: RoomListItem;
  onOpen: (id: string) => void;
  compact?: boolean;
}

export function RoomCard({ room, onOpen, compact = false }: RoomCardProps) {
  const { i18n } = useTranslation();

  return (
    <motion.button
      onClick={() => onOpen(room.id)}
      whileHover={{ y: -3, boxShadow: '0 8px 32px rgba(16,21,33,0.10), 0 16px 48px rgba(16,21,33,0.07)' }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="text-left w-full bg-white rounded-card shadow-card overflow-hidden group"
    >
      {/* Рядок адміна */}
      <div className={`flex items-center gap-2.5 px-3 pt-3 pb-2 ${room.status === 'closed' ? 'bg-rose-100' : ''}`}>
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
      <div className={`relative w-full overflow-hidden ${compact ? 'aspect-[32/9]' : 'aspect-[16/7]'}`}>
        <img
          src={room.coverUrl ? getMediaUrl(room.coverUrl) : '/room-cover-placeholder.jpeg'}
          alt={room.name}
          className={`w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out ${room.status === 'closed' ? 'grayscale' : ''}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
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
    </motion.button>
  );
}
