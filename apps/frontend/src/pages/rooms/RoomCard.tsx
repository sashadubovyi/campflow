import { useTranslation } from 'react-i18next';
import { Users, Calendar } from 'lucide-react';
import type { RoomListItem } from '../../shared/api/rooms.api';

function formatDateRange(
  startsAt: string | null,
  endsAt: string | null,
  locale: string,
): string | null {
  if (!startsAt) return null;
  const localeMap: Record<string, string> = { uk: 'uk-UA', en: 'en-US', ru: 'ru-RU' };
  const dateLocale = localeMap[locale] ?? 'uk-UA';
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' });
  return endsAt ? `${fmt(startsAt)} — ${fmt(endsAt)}` : fmt(startsAt);
}

interface RoomCardProps {
  room: RoomListItem;
  onOpen: (id: string) => void;
}

export function RoomCard({ room, onOpen }: RoomCardProps) {
  const { i18n } = useTranslation();
  const dates = formatDateRange(room.startsAt, room.endsAt, i18n.language);

  return (
    <button
      onClick={() => onOpen(room.id)}
      className="text-left w-full bg-white rounded-card shadow-card hover:shadow-card-lg transition-all duration-200 overflow-hidden group"
    >
      <div className="h-1 w-full bg-brand-gradient" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h3 className="text-base font-semibold text-neutral-900 group-hover:text-accent-600 transition leading-snug">
            {room.name}
          </h3>
          <span className="shrink-0 flex items-center gap-1 text-xs bg-neutral-100 text-neutral-500 rounded-full px-2.5 py-1 font-medium">
            <Users size={11} />
            {room.memberCount}
          </span>
        </div>
        {room.description && (
          <p className="text-sm text-neutral-500 line-clamp-2 mt-1.5">{room.description}</p>
        )}
        {dates && (
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 mt-3">
            <Calendar size={12} />
            {dates}
          </div>
        )}
      </div>
    </button>
  );
}
