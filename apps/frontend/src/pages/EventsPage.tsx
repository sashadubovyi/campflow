import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutList, Map as MapIcon, Calendar, Heart } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Calendar as BigCalendar, dateFnsLocalizer, type Event as RBCEvent } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { uk, enUS, ru, type Locale } from 'date-fns/locale';
import L from 'leaflet';
import { PageHeader } from '../shared/ui';
import { useRooms } from '../shared/api/rooms.hooks';
import { useMapPoints } from '../shared/api/map.hooks';
import type { MapPoint } from '../shared/api/map.api';
import type { RoomListItem } from '../shared/api/rooms.api';
import { RoomCard } from './rooms/RoomCard';

// ─── Leaflet icon fix (idempotent) ─────────────────────────────────────────
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const ROOM_COLORS = ['#2d6ff8', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2', '#9333ea', '#16a34a'];
function roomColor(roomId: string): string {
  let hash = 0;
  for (let i = 0; i < roomId.length; i++) hash = roomId.charCodeAt(i) + ((hash << 5) - hash);
  return ROOM_COLORS[Math.abs(hash) % ROOM_COLORS.length]!;
}

function pointIcon(roomId: string) {
  const color = roomColor(roomId);
  return L.divIcon({
    className: '',
    html: `<div style="background:${color};width:32px;height:32px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px ${color}66;"></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
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

function ViewToggle({ view, onChange }: { view: EventView; onChange: (v: EventView) => void }) {
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
            view === id ? 'bg-white text-accent-600 shadow-sm' : 'text-neutral-400 hover:text-neutral-600'
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
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-4 space-y-3">
        {rooms.map((room) => (
          <RoomCard key={room.id} room={room} onOpen={(id) => navigate(`/rooms/${id}`)} compact />
        ))}
      </div>
    </div>
  );
}

// ─── Map view ──────────────────────────────────────────────────────────────
function EventsMapView() {
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
        {points.map((p) => (
          <Marker key={p.id} position={[p.latitude, p.longitude]} icon={pointIcon(p.roomId)}>
            <Popup>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px' }}>
                <p style={{ fontWeight: 700, marginBottom: 2 }}>{p.label}</p>
                <p style={{ color: '#6b7280', fontSize: '11px' }}>{p.roomName}</p>
                {p.address && (
                  <p style={{ color: '#9ca3af', fontSize: '11px', marginTop: 4 }}>{p.address}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
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

function EventsCalendarView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
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
        onSelectEvent={(event) => navigate(`/rooms/${event.id}`)}
        popup
      />
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────
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
        {view === 'map' && <EventsMapView />}
        {view === 'calendar' && <EventsCalendarView />}
      </div>
    </div>
  );
}
