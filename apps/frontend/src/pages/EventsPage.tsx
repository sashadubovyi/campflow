import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutList, Map as MapIcon, Calendar, Heart } from 'lucide-react';
import { PageHeader } from '../shared/ui';

type EventView = 'list' | 'map' | 'calendar';

function ViewToggle({
  view,
  onChange,
}: {
  view: EventView;
  onChange: (v: EventView) => void;
}) {
  const buttons: { id: EventView; icon: typeof LayoutList }[] = [
    { id: 'list', icon: LayoutList },
    { id: 'map', icon: MapIcon },
    { id: 'calendar', icon: Calendar },
  ];
  return (
    <div className="flex items-center gap-0.5 bg-neutral-100 rounded-xl p-1">
      {buttons.map(({ id, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
            view === id
              ? 'bg-white text-accent-600 shadow-sm'
              : 'text-neutral-400 hover:text-neutral-600'
          }`}
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  );
}

function EmptyView({ label }: { label: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-3 text-neutral-400">
      <Heart size={40} strokeWidth={1.5} />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function EventsPage() {
  const { t } = useTranslation();
  const [view, setView] = useState<EventView>('list');

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title={t('nav.events')}
        right={<ViewToggle view={view} onChange={setView} />}
      />
      <div className="flex-1 min-h-0 overflow-hidden">
        {view === 'list' && <EmptyView label={t('events.emptyList')} />}
        {view === 'map' && <EmptyView label={t('events.emptyMap')} />}
        {view === 'calendar' && <EmptyView label={t('events.emptyCalendar')} />}
      </div>
    </div>
  );
}
