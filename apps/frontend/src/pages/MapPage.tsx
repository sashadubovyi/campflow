import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';
import { useMapPoints } from '../shared/api/map.hooks';
import type { MapPoint } from '../shared/api/map.api';

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

export function MapPage() {
  const { t } = useTranslation();
  const { data: points = [], isLoading } = useMapPoints();

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-neutral-400 animate-pulse">
        {t('common.loading')}
      </div>
    );
  }

  if (points.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-neutral-400 px-6 text-center">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
        <p className="text-lg font-medium text-neutral-600">{t('map.empty')}</p>
        <p className="text-sm">{t('map.emptyHint')}</p>
      </div>
    );
  }

  const center: [number, number] = [points[0]!.latitude, points[0]!.longitude];

  return (
    <div className="h-full">
      <MapContainer
        center={center}
        zoom={11}
        scrollWheelZoom={true}
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
