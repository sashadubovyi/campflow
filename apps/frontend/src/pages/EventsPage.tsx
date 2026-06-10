import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutList, Map as MapIcon, Calendar, Heart, Plus, KeyRound, ChevronDown } from 'lucide-react';
import L from 'leaflet';
import { MapContainer, TileLayer, CircleMarker, Marker, useMap } from 'react-leaflet';
import { Calendar as BigCalendar, dateFnsLocalizer, type Event as RBCEvent } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { uk, enUS, ru, type Locale } from 'date-fns/locale';
import { PageHeader } from '../shared/ui';
import { useRooms } from '../shared/api/rooms.hooks';
import { useMapPoints } from '../shared/api/map.hooks';
import { useMediaQuery } from '../shared/lib/useMediaQuery';
import type { MapPoint } from '../shared/api/map.api';
import type { RoomListItem } from '../shared/api/rooms.api';
import { RoomCard } from './rooms/RoomCard';
import { CreateRoomModal } from './rooms/CreateRoomModal';
import { JoinRoomModal } from './rooms/JoinRoomModal';
import { RoomEventModal } from './events/RoomEventModal';
import { getMediaUrl } from '../shared/lib/getMediaUrl';

const ROOM_COLORS = ['#2d6ff8', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2', '#9333ea', '#16a34a'];
function roomColor(roomId: string): string {
  let hash = 0;
  for (let i = 0; i < roomId.length; i++) hash = roomId.charCodeAt(i) + ((hash << 5) - hash);
  return ROOM_COLORS[Math.abs(hash) % ROOM_COLORS.length]!;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function photoMarkerIcon(coverUrl: string, color: string, approved: boolean): L.DivIcon {
  const size = approved ? 40 : 32;
  const html = `
    <div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:#fff;padding:2px;box-shadow:0 2px 6px rgba(0,0,0,.25);
      border:2px solid ${color};
      opacity:${approved ? 1 : 0.85};
    ">
      <img src="${escapeHtml(getMediaUrl(coverUrl))}" alt=""
        style="width:100%;height:100%;border-radius:50%;object-fit:cover;display:block;" />
    </div>`;
  return L.divIcon({
    className: 'photo-marker',
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function FitBounds({ points }: { points: MapPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    const timer = setTimeout(() => {
      if (points.length === 1) {
        map.setView([points[0]!.latitude, points[0]!.longitude], 13);
      } else {
        const bounds = L.latLngBounds(points.map((p) => [p.latitude, p.longitude] as [number, number]));
        map.fitBounds(bounds, { padding: [48, 48], maxZoom: 13 });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [points.length, map]);
  return null;
}

// ─── date-fns localizer ────────────────────────────────────────────────────
const locales = { uk, en: enUS, ru };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date, options?: { locale?: Locale | undefined }) =>
    startOfWeek(date, { locale: options?.locale ?? uk }),
  getDay,
  locales,
});

// ─── View types ────────────────────────────────────────────────────────────
type EventView = 'list' | 'map' | 'calendar';

const VIEW_ICONS: Record<EventView, typeof LayoutList> = {
  list: LayoutList,
  map: MapIcon,
  calendar: Calendar,
};

// Desktop: всі 3 кнопки завжди видно
function DesktopViewToggle({ view, onChange }: { view: EventView; onChange: (v: EventView) => void }) {
  const buttons: EventView[] = ['list', 'map', 'calendar'];
  return (
    <div className="flex items-center gap-0.5 bg-neutral-100 rounded-xl p-1">
      {buttons.map((id) => {
        const Icon = VIEW_ICONS[id];
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
              view === id ? 'bg-white/85 border border-white/90 text-accent-600 shadow-sm' : 'text-neutral-400 hover:text-neutral-600'
            }`}
          >
            <Icon size={16} />
          </button>
        );
      })}
    </div>
  );
}

// Mobile: одна кнопка, по кліку — 3 окремі
function MobileViewToggle({ view, onChange }: { view: EventView; onChange: (v: EventView) => void }) {
  const [expanded, setExpanded] = useState(false);
  const ActiveIcon = VIEW_ICONS[view];
  const buttons: EventView[] = ['list', 'map', 'calendar'];

  if (expanded) {
    return (
      <div className="flex items-center gap-0.5 bg-neutral-100 rounded-xl p-1">
        {buttons.map((id) => {
          const Icon = VIEW_ICONS[id];
          return (
            <button
              key={id}
              onClick={() => { onChange(id); setExpanded(false); }}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                view === id ? 'bg-white/85 border border-white/90 text-accent-600 shadow-sm' : 'text-neutral-400 hover:text-neutral-600'
              }`}
            >
              <Icon size={16} />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <button
      onClick={() => setExpanded(true)}
      className="flex items-center gap-1 bg-neutral-100 rounded-xl px-2 h-9 text-neutral-500"
    >
      <ActiveIcon size={16} />
      <ChevronDown size={13} />
    </button>
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

// ─── List view ─────────────────────────────────────────────────────────────
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
  if (!rooms || rooms.length === 0) return <EmptyView label={t('events.emptyList')} />;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto w-full px-4 md:px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {rooms.map((room) => (
          <RoomCard key={room.id} room={room} onOpen={(id) => navigate(`/rooms/${id}`)} compact />
        ))}
      </div>
    </div>
  );
}

// ─── Map view ──────────────────────────────────────────────────────────────
function EventsMapView({ onSelectRoom }: { onSelectRoom: (roomId: string) => void }) {
  const { t } = useTranslation();
  const { data: points = [], isLoading } = useMapPoints();

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-neutral-400 text-sm animate-pulse">
        {t('common.loading')}
      </div>
    );
  }
  if (points.length === 0) return <EmptyView label={t('events.emptyMap')} />;

  return (
    <div className="h-full min-h-0">
      <MapContainer
        center={[points[0]!.latitude, points[0]!.longitude]}
        zoom={11}
        scrollWheelZoom
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />
        {points.map((p) => {
          const color = roomColor(p.roomId);
          if (p.roomCoverUrl) {
            return (
              <Marker
                key={p.id}
                position={[p.latitude, p.longitude]}
                icon={photoMarkerIcon(p.roomCoverUrl, color, p.approved)}
                eventHandlers={{ click: () => onSelectRoom(p.roomId) }}
              />
            );
          }
          return (
            <CircleMarker
              key={p.id}
              center={[p.latitude, p.longitude]}
              radius={p.approved ? 14 : 10}
              pathOptions={{
                color: '#fff',
                weight: 3,
                fillColor: color,
                fillOpacity: p.approved ? 1 : 0.65,
              }}
              eventHandlers={{ click: () => onSelectRoom(p.roomId) }}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}

// ─── Calendar view ─────────────────────────────────────────────────────────
interface CalendarEvent extends RBCEvent {
  id: string;
  resource: RoomListItem;
}

function roomsToEvents(rooms: RoomListItem[]): CalendarEvent[] {
  return rooms
    .filter((r) => r.startsAt)
    .map((r) => ({
      id: r.id,
      title: r.name,
      start: new Date(r.startsAt!),
      end: r.endsAt ? new Date(r.endsAt) : new Date(r.startsAt!),
      resource: r,
    }));
}

function EventsCalendarView({ onSelectRoom }: { onSelectRoom: (roomId: string) => void }) {
  const { t, i18n } = useTranslation();
  const { data: rooms = [], isLoading } = useRooms();

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-neutral-400 text-sm animate-pulse">
        {t('common.loading')}
      </div>
    );
  }

  const events = roomsToEvents(rooms);
  const locale = i18n.language === 'uk' ? uk : i18n.language === 'ru' ? ru : enUS;

  if (events.length === 0) return <EmptyView label={t('events.emptyCalendar')} />;

  return (
    <div className="h-full overflow-hidden px-4 md:px-6 py-4">
      <style>{`
        .rbc-calendar { font-family: inherit; }
        .rbc-header { background: #f9fafb; border-color: #f3f4f6; font-size: 12px; font-weight: 600; color: #6b7280; padding: 8px 4px; }
        .rbc-month-view, .rbc-time-view { border-radius: 12px; border-color: #f3f4f6; overflow: hidden; background: #fff; }
        .rbc-day-bg { border-color: #f3f4f6; }
        .rbc-today { background-color: #eff6ff; }
        .rbc-off-range-bg { background-color: #fafafa; }
        .rbc-event { background: linear-gradient(135deg,#598dff,#2d6ff8); border: none; border-radius: 6px; font-size: 11px; padding: 2px 6px; }
        .rbc-event.rbc-selected { background: linear-gradient(135deg,#3b6fda,#1a4fd6); }
        .rbc-show-more { font-size: 11px; color: #2d6ff8; }
        .rbc-toolbar button { border-radius: 8px; border-color: #e5e7eb; font-size: 13px; color: #374151; }
        .rbc-toolbar button:hover { background: #f3f4f6; }
        .rbc-toolbar button.rbc-active { background: #2d6ff8; color: #fff; border-color: #2d6ff8; }
        .rbc-date-cell { font-size: 12px; color: #374151; }
        .rbc-date-cell.rbc-now { font-weight: 700; color: #2d6ff8; }
      `}</style>
      <BigCalendar<CalendarEvent>
        localizer={localizer}
        events={events}
        culture={i18n.language}
        formats={{ monthHeaderFormat: (date) => format(date, 'LLLL yyyy', { locale }) }}
        defaultView="month"
        views={['month']}
        style={{ height: '100%' }}
        onSelectEvent={(event) => onSelectRoom(event.id)}
        popup
      />
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────
export function EventsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [view, setView] = useState<EventView>('list');
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const { data: allRooms = [] } = useRooms();
  const selectedRoom = allRooms.find((r) => r.id === selectedRoomId) ?? null;
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const mobileLeft = !isDesktop ? (
    <div className="flex items-center gap-1">
      <button
        onClick={() => setShowCreate(true)}
        className="w-8 h-8 flex items-center justify-center rounded-xl btn-glass-blue shadow-glass-blue"
        title={t('rooms.newRoom')}
      >
        <Plus size={16} />
      </button>
      <button
        onClick={() => setShowJoin(true)}
        className="w-8 h-8 flex items-center justify-center rounded-xl glass-icon"
        title={t('rooms.joinByCode')}
      >
        <KeyRound size={16} />
      </button>
    </div>
  ) : undefined;

  const headerRight = isDesktop ? (
    <DesktopViewToggle view={view} onChange={setView} />
  ) : (
    <MobileViewToggle view={view} onChange={setView} />
  );

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title={<span className="font-display">{t('nav.titles.events')}</span>}
        left={mobileLeft}
        right={headerRight}
      />
      <div className="flex-1 min-h-0">
        {view === 'list' && <EventsListView />}
        {view === 'map' && <EventsMapView onSelectRoom={setSelectedRoomId} />}
        {view === 'calendar' && <EventsCalendarView onSelectRoom={setSelectedRoomId} />}
      </div>

      <RoomEventModal
        open={!!selectedRoom}
        onClose={() => setSelectedRoomId(null)}
        room={selectedRoom}
      />

      {showCreate && (
        <CreateRoomModal
          onClose={() => setShowCreate(false)}
          onCreated={(id) => { setShowCreate(false); navigate(`/rooms/${id}`); }}
        />
      )}
      {showJoin && (
        <JoinRoomModal
          onClose={() => setShowJoin(false)}
          onJoined={(id) => { setShowJoin(false); navigate(`/rooms/${id}`); }}
        />
      )}
    </div>
  );
}
