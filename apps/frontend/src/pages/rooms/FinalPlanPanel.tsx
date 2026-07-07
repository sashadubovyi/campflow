import { useTranslation } from 'react-i18next';
import { useFinalPlan } from '../../shared/api/final-plan.hooks';
import type { FinalPlan, FinalPlanItem } from '../../shared/api/final-plan.api';
import { useRoom } from '../../shared/api/rooms.hooks';
import type { RoomDetails } from '../../shared/api/rooms.api';
import { Avatar } from '../../shared/ui/Avatar';
import { relativeTime } from '../../shared/lib/relativeTime';
import { buildIcs, downloadIcs } from '../../shared/lib/buildIcs';
import { Calendar, CalendarPlus, MapPin, ClipboardList, type LucideIcon } from 'lucide-react';

interface Props {
  roomId: string;
}

function exportPlanToCalendar(room: RoomDetails, plan: FinalPlan) {
  const firstLocation = plan.grouped.locations.find((l) => l.address || l.title);
  const geoItem = plan.grouped.locations.find(
    (l) => l.latitude !== null && l.longitude !== null,
  );

  const descriptionLines = [
    room.description ?? '',
    ...plan.grouped.decisions.map((d) => `✔ ${d.title}`),
    ...plan.grouped.items.map(
      (i) => `• ${i.title}${i.assignee ? ` — ${i.assignee.fullName}` : ''}`,
    ),
  ].filter(Boolean);

  const ics = buildIcs({
    uid: `room-${room.id}@andu`,
    title: room.name,
    description: descriptionLines.join('\n'),
    startsAt: new Date(room.startsAt as string),
    endsAt: room.endsAt ? new Date(room.endsAt) : null,
    location: firstLocation ? (firstLocation.address ?? firstLocation.title) : null,
    geo: geoItem ? { latitude: geoItem.latitude!, longitude: geoItem.longitude! } : null,
  });
  downloadIcs(room.name, ics);
}

export function FinalPlanPanel({ roomId }: Props) {
  const { t } = useTranslation();
  const { data: plan, isLoading } = useFinalPlan(roomId);
  const { data: room } = useRoom(roomId);

  if (isLoading) {
    return (
      <div className="p-4 text-center text-neutral-400 font-body text-sm animate-pulse">
        {t('common.loading')}
      </div>
    );
  }

  const isEmpty =
    !plan ||
    (plan.grouped.decisions.length === 0 &&
      plan.grouped.locations.length === 0 &&
      plan.grouped.items.length === 0);

  if (isEmpty) {
    return (
      <div className="p-6 text-center text-neutral-400 font-body flex flex-col items-center">
        <ClipboardList size={40} className="text-neutral-300 mb-3" />
        <p className="font-display text-base text-neutral-500 mb-1">{t('polls.finalPlan.empty')}</p>
        <p className="text-xs text-neutral-400">{t('polls.finalPlan.emptyHint')}</p>
      </div>
    );
  }

  return (
    <div className="px-3 py-3 space-y-4">
      {/* Експорт у календар: тільки якщо в кімнати є дата */}
      {room?.startsAt && (
        <button
          onClick={() => exportPlanToCalendar(room, plan)}
          className="w-full flex items-center justify-center gap-2 glass-btn py-2.5 rounded-xl text-sm font-semibold text-neutral-700 transition"
        >
          <CalendarPlus size={15} />
          {t('polls.finalPlan.addToCalendar')}
        </button>
      )}

      {plan.grouped.decisions.length > 0 && (
        <Section title={t('polls.finalPlan.decisions')} icon={Calendar}>
          {plan.grouped.decisions.map((item) => (
            <DecisionCard key={item.id} item={item} />
          ))}
        </Section>
      )}

      {plan.grouped.locations.length > 0 && (
        <Section title={t('polls.finalPlan.locations')} icon={MapPin}>
          {plan.grouped.locations.map((item) => (
            <LocationCard key={item.id} item={item} />
          ))}
        </Section>
      )}

      {plan.grouped.items.length > 0 && (
        <Section title={t('polls.finalPlan.items')} icon={ClipboardList}>
          {plan.grouped.items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="font-body text-xs font-semibold text-neutral-400 uppercase tracking-widest px-2 mb-2 flex items-center gap-1.5">
        <Icon size={13} />
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function DecisionCard({ item }: { item: FinalPlanItem }) {
  const { t } = useTranslation();
  return (
    <div className="glass-card rounded-xl p-3">
      <p className="text-sm font-medium text-neutral-900">{item.title}</p>
      <p className="text-[10px] text-neutral-400 mt-1">
        {t('polls.finalPlan.approvedAt', { time: relativeTime(item.approvedAt) })}
      </p>
    </div>
  );
}

function LocationCard({ item }: { item: FinalPlanItem }) {
  const { t } = useTranslation();
  return (
    <div className="glass-card rounded-xl p-3">
      <p className="text-sm font-medium text-neutral-900 flex items-center gap-1">
        <MapPin size={13} className="text-neutral-400 shrink-0" />
        {item.title}
      </p>
      {item.address && (
        <p className="text-[10px] text-neutral-400 mt-0.5 truncate">{item.address}</p>
      )}
      {item.latitude !== null && item.longitude !== null && (
        <a
          href={`https://www.openstreetmap.org/?mlat=${item.latitude}&mlon=${item.longitude}#map=15/${item.latitude}/${item.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-accent-600 hover:text-neutral-900 transition mt-1 inline-block"
        >
          {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)} ↗
        </a>
      )}
      <p className="text-[10px] text-neutral-400 mt-1">
        {t('polls.finalPlan.approvedAt', { time: relativeTime(item.approvedAt) })}
      </p>
    </div>
  );
}

function ItemCard({ item }: { item: FinalPlanItem }) {
  const { t } = useTranslation();
  return (
    <div className="glass-card rounded-xl p-3">
      <p className="text-sm font-medium text-neutral-900">{item.title}</p>
      <div className="flex items-center justify-between mt-1.5">
        {item.assignee ? (
          <div className="flex items-center gap-1.5">
            <Avatar
              fullName={item.assignee.fullName}
              avatarUrl={item.assignee.avatarUrl}
              size={18}
            />
            <span className="text-xs text-neutral-700">{item.assignee.fullName}</span>
          </div>
        ) : (
          <span className="text-[10px] text-neutral-400 italic">
            {t('polls.finalPlan.noAssignee')}
          </span>
        )}
        <span className="text-[10px] text-neutral-400">{relativeTime(item.approvedAt)}</span>
      </div>
    </div>
  );
}
