import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutList, Map as MapIcon, Calendar, Heart } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';
import { PageHeader } from '../shared/ui';
import { useRooms } from '../shared/api/rooms.hooks';
import { useMapPoints } from '../shared/api/map.hooks';
import type { MapPoint } from '../shared/api/map.api';
import { RoomCard } from './rooms/RoomCard';

// ─── Leaflet icon fix (idempotent) ─────────────────────────────────────────
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function pointIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="background:linear-gradient(135deg,#598dff,#2d6ff8);width:32px;height:32px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(45,111,248,0.4);"></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function FitBounds({ points }: { points: MapPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0]!.latitude, points[0]!.longitude], 13);
      return;
    }
    const bounds = L.latLngBounds(points.map((p) => [p.latitude, p.longitude]));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 13 });
  }, [points, map]);
  return null;
}

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
          <Marker key={p.id} position={[p.latitude, p.longitude]} icon={pointIcon()}>
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

// ─── Calendar view placeholder (replaced in next commit) ───────────────────
function EventsCalendarView() {
  const { t } = useTranslation();
  return <EmptyView label={t('events.emptyCalendar')} />;
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
