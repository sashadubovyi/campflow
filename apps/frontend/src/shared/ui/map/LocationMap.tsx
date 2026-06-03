import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Виправлення дефолтних іконок Leaflet — без цього маркери падають з помилкою URL.
// Це класична проблема Leaflet + bundler (webpack/vite).
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Кастомна іконка з кількістю голосів
function votesIcon(votes: number, isWinning: boolean): L.DivIcon {
  const bg = isWinning ? '#f97316' : '#16a34a'; // ember vs forest
  return L.divIcon({
    className: 'campflow-marker',
    html: `
      <div style="
        background:${bg};
        color:#fff;
        width:32px;
        height:32px;
        border-radius:50%;
        display:flex;
        align-items:center;
        justify-content:center;
        font-weight:700;
        font-size:13px;
        font-family:'Outfit',sans-serif;
        border:3px solid #fff;
        box-shadow:0 2px 6px rgba(0,0,0,0.25);
      ">${votes}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

export interface MapPoint {
  id: string;
  label: string;
  address?: string | null;
  latitude: number;
  longitude: number;
  votes: number;
  isWinning?: boolean;
}

interface Props {
  points: MapPoint[];
  height?: number;
  /** Якщо передано — мапа автоматично відцентрує камеру на цих точках. */
  fitBounds?: boolean;
}

// Допоміжний компонент, який підлаштовує камеру під bounds
function FitBounds({ points }: { points: MapPoint[] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0]!.latitude, points[0]!.longitude], 13);
      return;
    }
    const bounds = L.latLngBounds(points.map((p) => [p.latitude, p.longitude]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [points, map]);

  return null;
}

export function LocationMap({ points, height = 240, fitBounds = true }: Props) {
  // Стартовий центр: Київ. Якщо є точки, FitBounds одразу пересуне.
  const initialCenter: [number, number] = points[0]
    ? [points[0].latitude, points[0].longitude]
    : [50.4501, 30.5234];

  return (
    <div className="rounded-xl overflow-hidden border border-neutral-100" style={{ height }}>
      <MapContainer
        center={initialCenter}
        zoom={11}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {fitBounds && <FitBounds points={points} />}
        {points.map((p) => (
          <Marker
            key={p.id}
            position={[p.latitude, p.longitude]}
            icon={votesIcon(p.votes, !!p.isWinning)}
          >
            <Popup>
              <div className="font-body text-sm">
                <p className="font-semibold text-neutral-900">{p.label}</p>
                {p.address && <p className="text-neutral-700 text-xs mt-1">{p.address}</p>}
                <p className="text-neutral-400 text-xs mt-1.5">
                  {p.votes} {p.votes === 1 ? 'голос' : 'голосів'}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
