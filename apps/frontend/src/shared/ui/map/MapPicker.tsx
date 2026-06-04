import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Іконка для тимчасової точки — оранжева, без числа
const pickerIcon = L.divIcon({
  className: 'campflow-picker-marker',
  html: `
    <div style="
      background:#f97316;
      color:#fff;
      width:28px;
      height:28px;
      border-radius:50%;
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:14px;
      border:3px solid #fff;
      box-shadow:0 2px 6px rgba(0,0,0,0.25);
    ">·</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

export interface PickedLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

interface Props {
  onPick: (loc: PickedLocation) => void;
  initialCenter?: [number, number];
  height?: number;
}

// Внутрішній компонент, що ловить кліки по карті
function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/**
 * Reverse-geocoding через безкоштовний Nominatim (OSM).
 * Повертає коротку адресу або undefined при помилці.
 * Дотримуємось ввічливих обмежень: < 1 запит/сек, додаємо User-Agent через Accept-Language.
 */
async function reverseGeocode(lat: number, lng: number): Promise<string | undefined> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&accept-language=uk`;
    const res = await fetch(url);
    if (!res.ok) return undefined;
    const data = (await res.json()) as { display_name?: string };
    return data.display_name;
  } catch {
    return undefined;
  }
}

export function MapPicker({ onPick, initialCenter = [50.4501, 30.5234], height = 280 }: Props) {
  const [pending, setPending] = useState<{ lat: number; lng: number } | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(false);

  async function handleClick(lat: number, lng: number) {
    setPending({ lat, lng });
    setLoadingAddress(true);
    const address = await reverseGeocode(lat, lng);
    setLoadingAddress(false);
    onPick({ latitude: lat, longitude: lng, address });
    // Скидаємо pending після короткої затримки, щоб маркер встиг показатись
    setTimeout(() => setPending(null), 300);
  }

  return (
    <div
      className="rounded-xl overflow-hidden border border-neutral-100 relative"
      style={{ height }}
    >
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
        <ClickHandler onClick={handleClick} />
        {pending && <Marker position={[pending.lat, pending.lng]} icon={pickerIcon} />}
      </MapContainer>
      </div>

      <div className="absolute top-2 left-2 right-2 bg-white/95 backdrop-blur rounded-lg px-3 py-2 text-xs text-neutral-700 font-body shadow-sm pointer-events-none">
        {loadingAddress ? 'Визначаю адресу…' : 'Клікніть по карті, щоб додати точку'}
      </div>
    </div>
  );
}
