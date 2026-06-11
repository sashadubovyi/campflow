import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, Check, Loader2, Clock } from 'lucide-react';
import type { PublicRoomItem } from '../../shared/api/rooms.api';
import { useRequestJoin } from '../../shared/api/rooms.hooks';
import { Avatar } from '../../shared/ui';
import { getMediaUrl } from '../../shared/lib/getMediaUrl';

interface Props {
  room: PublicRoomItem;
}

function formatDate(iso: string | null, locale: string): string {
  if (!iso) return '';
  const map: Record<string, string> = { uk: 'uk-UA', en: 'en-US', ru: 'ru-RU' };
  return new Date(iso).toLocaleDateString(map[locale] ?? 'uk-UA', {
    day: 'numeric',
    month: 'short',
  });
}

export function PublicRoomCard({ room }: Props) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const requestJoin = useRequestJoin();
  const [requested, setRequested] = useState(false);

  function handleClick() {
    if (room.isMember) {
      navigate(`/rooms/${room.id}`);
    }
  }

  async function handleJoin(e: React.MouseEvent) {
    e.stopPropagation();
    await requestJoin.mutateAsync(room.id);
    setRequested(true);
  }

  return (
    <article
      onClick={handleClick}
      className={`glass-card overflow-hidden transition-all duration-200 ${
        room.isMember ? 'cursor-pointer hover:shadow-glass-hover' : ''
      }`}
    >
      {/* Header: admin info */}
      <div className="flex items-center gap-2.5 px-3 pt-3 pb-2">
        {room.admin ? (
          <Avatar fullName={room.admin.fullName} avatarUrl={room.admin.avatarUrl} size={32} />
        ) : (
          <div className="w-8 h-8 rounded-full bg-neutral-200 shrink-0" />
        )}
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-sm font-semibold text-neutral-900 truncate leading-tight">
            {room.name}
          </span>
          {room.admin && (
            <span className="text-xs text-neutral-400 truncate leading-tight mt-0.5">
              {room.admin.fullName}
            </span>
          )}
        </div>
      </div>

      {/* Cover */}
      <div className="relative w-full aspect-[16/7] overflow-hidden bg-neutral-100">
        {room.coverUrl ? (
          <img
            src={getMediaUrl(room.coverUrl)}
            alt=""
            onError={(e) => { (e.target as HTMLImageElement).src = '/room-cover-placeholder.jpeg'; }}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-accent-50 to-accent-100" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-2 pt-6 flex items-end justify-between gap-2">
          <span className="flex items-center gap-1 text-white/80 text-xs">
            {room.startsAt && (
              <>
                <Calendar size={11} />
                {formatDate(room.startsAt, i18n.language)}
              </>
            )}
          </span>
          <span className="flex items-center gap-1 text-white/80 text-xs">
            <Users size={11} />
            {room.memberCount}
          </span>
        </div>
      </div>

      {/* Description */}
      {room.description && (
        <div className="px-3 pt-2.5">
          <p className="text-sm text-neutral-700 line-clamp-2">{room.description}</p>
        </div>
      )}

      {/* Action */}
      <div className="p-3">
        {room.isMember ? (
          <button
            disabled
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-100 text-neutral-500 text-xs font-semibold"
          >
            <Check size={14} />
            {t('feed.alreadyMember', 'Ви в кімнаті')}
          </button>
        ) : requested ? (
          <button
            disabled
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 text-amber-600 text-xs font-semibold"
          >
            <Clock size={14} />
            {t('feed.requestSent', 'Запит надіслано')}
          </button>
        ) : (
          <button
            onClick={handleJoin}
            disabled={requestJoin.isPending}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl btn-glass-blue disabled:opacity-60 text-xs font-semibold transition"
          >
            {requestJoin.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
            {t('feed.requestJoin', 'Подати запит')}
          </button>
        )}
      </div>
    </article>
  );
}
