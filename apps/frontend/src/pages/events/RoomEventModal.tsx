import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, CheckCircle2, ArrowRight } from 'lucide-react';
import { Modal } from '../../shared/ui/Modal';
import { useFinalPlan } from '../../shared/api/final-plan.hooks';
import type { RoomListItem } from '../../shared/api/rooms.api';

interface Props {
  open: boolean;
  onClose: () => void;
  room: RoomListItem | null;
}

function formatDate(iso: string | null, locale: string): string {
  if (!iso) return '';
  const map: Record<string, string> = { uk: 'uk-UA', en: 'en-US', ru: 'ru-RU' };
  return new Date(iso).toLocaleDateString(map[locale] ?? 'uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function RoomEventModal({ open, onClose, room }: Props) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { data: plan } = useFinalPlan(room?.id ?? '');

  if (!room) return null;

  const approved = plan?.items ?? [];

  return (
    <Modal open={open} onClose={onClose} size="md">
      <div className="space-y-4">
        {room.coverUrl && (
          <div className="-mx-6 -mt-6 aspect-[16/7] overflow-hidden bg-neutral-100">
            <img src={room.coverUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        <div>
          <h2 className="font-display text-xl font-bold text-neutral-900">{room.name}</h2>
          {room.description && (
            <p className="text-sm text-neutral-500 mt-1 whitespace-pre-line">{room.description}</p>
          )}
        </div>

        {(room.startsAt || room.endsAt) && (
          <div className="flex items-center gap-2 text-sm text-neutral-700">
            <Calendar size={15} className="text-neutral-400 shrink-0" />
            <span>
              {formatDate(room.startsAt, i18n.language)}
              {room.endsAt && room.endsAt !== room.startsAt && (
                <> — {formatDate(room.endsAt, i18n.language)}</>
              )}
            </span>
          </div>
        )}

        {approved.length > 0 && (
          <div>
            <h3 className="text-xs uppercase tracking-widest text-neutral-400 mb-2">
              {t('events.approvedItems', 'Затверджено')}
            </h3>
            <ul className="space-y-1.5">
              {approved.map((item) => (
                <li key={item.id} className="flex items-start gap-2 text-sm text-neutral-700">
                  <CheckCircle2 size={15} className="text-accent-500 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{item.title}</p>
                    {item.address && (
                      <p className="flex items-center gap-1 text-xs text-neutral-400 mt-0.5">
                        <MapPin size={11} className="shrink-0" />
                        <span className="truncate">{item.address}</span>
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={() => {
            onClose();
            navigate(`/rooms/${room.id}`);
          }}
          className="w-full flex items-center justify-center gap-2 bg-brand-gradient hover:bg-brand-gradient-hover text-white font-semibold py-3 rounded-xl transition text-sm"
        >
          {t('events.openRoom', 'Перейти в кімнату')}
          <ArrowRight size={16} />
        </button>
      </div>
    </Modal>
  );
}
