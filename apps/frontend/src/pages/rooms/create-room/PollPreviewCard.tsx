import { useTranslation } from 'react-i18next';
import { MapPin, CheckSquare, CircleDot } from 'lucide-react';
import type { DraftPoll } from '../../../shared/api/ai-rooms.api';

export function PollPreviewCard({ poll, index }: { poll: DraftPoll; index: number }) {
  const { t } = useTranslation();
  const icons = { single_choice: CircleDot, multi_choice: CheckSquare, location: MapPin };
  const Icon = icons[poll.kind];
  const places = poll.resolvedPlaces ?? [];

  return (
    <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-100">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-5 h-5 rounded-full bg-accent-100 text-accent-600 flex items-center justify-center text-xs font-bold shrink-0">
          {index + 1}
        </span>
        <Icon size={14} className="text-accent-500 shrink-0" />
        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
          {poll.kind === 'single_choice' ? t('polls.types.singleChoice') :
           poll.kind === 'multi_choice' ? t('polls.types.multiChoice') :
           t('polls.types.location')}
        </span>
      </div>
      <p className="text-sm font-semibold text-neutral-900 mb-2">{poll.question}</p>
      {poll.options && poll.options.length > 0 && (
        <ul className="space-y-1">
          {poll.options.map((opt, i) => (
            <li key={i} className="text-xs text-neutral-600 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-400 shrink-0" />
              {opt}
            </li>
          ))}
        </ul>
      )}
      {poll.kind === 'location' && (
        <div className="mt-1">
          {places.length > 0 ? (
            <ul className="space-y-1">
              {places.map((p, i) => (
                <li key={i} className="text-xs text-neutral-600 flex items-center gap-1.5">
                  <MapPin size={10} className="text-accent-400 shrink-0" />
                  {p.label}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-neutral-400 italic">
              {poll.geoQuery ? `${poll.geoQuery.category} · ${poll.geoQuery.area}` : t('polls.types.location')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
