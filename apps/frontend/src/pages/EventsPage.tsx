import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutList, Map as MapIcon, Calendar, Heart } from 'lucide-react';
import { PageHeader } from '../shared/ui';
import { useRooms } from '../shared/api/rooms.hooks';
import { RoomCard } from './rooms/RoomCard';

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
    <div className="h-full flex flex-col items-center justify-center gap-3 text-neutral-400 px-6">
      <Heart size={40} strokeWidth={1.5} />
      <p className="text-sm text-center">{label}</p>
    </div>
  );
}

function EventsListView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: rooms, isLoading } = useRooms();

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-neutral-400 text-sm animate-pulse">
        {t('common.loading')}
      </div>
    );
  }

  if (!rooms || rooms.length === 0) {
    return <EmptyView label={t('events.emptyList')} />;
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-4 space-y-3">
        {rooms.map((room) => (
          <RoomCard key={room.id} room={room} onOpen={(id) => navigate(`/rooms/${id}`)} />
        ))}
      </div>
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
      <div className="flex-1 min-h-0">
        {view === 'list' && <EventsListView />}
        {view === 'map' && <EmptyView label={t('events.emptyMap')} />}
        {view === 'calendar' && <EmptyView label={t('events.emptyCalendar')} />}
      </div>
    </div>
  );
}
