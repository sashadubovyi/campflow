import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { InvalidateSizeOnMount } from './InvalidateSizeOnMount';

// Кастомна іконка з кількістю голосів. Мемоїзуємо через Map щоб уникнути
// recreate-іконки при кожному рендері — це запобігає "мерехтінню" маркерів.
const iconCache = new Map<string, L.DivIcon>();

function votesIcon(votes: number, isWinning: boolean): L.DivIcon {
  const key = `${votes}-${String(isWinning)}`;
  const cached = iconCache.get(key);
  if (cached) return cached;

  const bg = isWinning ? '#f97316' : '#16a34a';
  const icon = L.divIcon({
    className: 'campflow-marker',
    html: `<div style="background:${bg};color:#fff;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;font-family:Inter,sans-serif;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.25)">${votes}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
  iconCache.set(key, icon);
  return icon;
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

// FitBounds: центрує карту на точках після ініціалізації.
// Запускаємо ОДИН РАЗ (точки зазвичай статичні після завантаження).
// setTimeout 150мс дає Leaflet завершити власну ініціалізацію pane-ів
// перед setView/fitBounds — без цього маркери іноді "зникали" після анімації.
function FitBounds({ points }: { points: MapPoint[] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;
    const timer = setTimeout(() => {
      try {
        // Спершу перемірюємо контейнер — fitBounds на "сирому" розмірі
        // центрує камеру неправильно і лишає сірі плитки.
        map.invalidateSize();
        if (points.length === 1) {
          map.setView([points[0]!.latitude, points[0]!.longitude], 13);
        } else {
          const bounds = L.latLngBounds(
            points.map((p) => [p.latitude, p.longitude] as [number, number]),
          );
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
        }
      } catch {
        // map може бути вже unmounted
      }
    }, 150);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points.length, map]);

  return null;
}

export function LocationMap({ points, height = 240, fitBounds = true }: Props) {
  // Стартовий центр: Київ. Якщо є точки, FitBounds одразу пересуне.
  const initialCenter: [number, number] = points[0]
    ? [points[0].latitude, points[0].longitude]
    : [50.4501, 30.5234];

  return (
    <div className="rounded-xl overflow-hidden border border-neutral-100" style={{ height }}>
      <div style={{ isolation: 'isolate', position: 'relative', height: '100%' }}>
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
        <InvalidateSizeOnMount />
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
    </div>
  );
}
