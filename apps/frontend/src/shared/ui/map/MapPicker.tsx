import { useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, ChevronDown, ChevronUp, Loader2, Search } from 'lucide-react';

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

function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

async function forwardGeocode(query: string): Promise<PickedLocation | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&accept-language=uk`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as { lat?: string; lon?: string; display_name?: string }[];
    const first = data[0];
    if (!first?.lat || !first?.lon) return null;
    return {
      latitude: parseFloat(first.lat),
      longitude: parseFloat(first.lon),
      address: first.display_name,
    };
  } catch {
    return null;
  }
}

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
  const [showMap, setShowMap] = useState(false);
  const [addressInput, setAddressInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [mapCenter, setMapCenter] = useState<[number, number]>(initialCenter);
  const [pending, setPending] = useState<{ lat: number; lng: number } | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSearch() {
    const q = addressInput.trim();
    if (!q) return;
    setSearching(true);
    setSearchError('');
    const loc = await forwardGeocode(q);
    setSearching(false);
    if (!loc) {
      setSearchError('Адресу не знайдено. Спробуйте інший запит або оберіть на карті.');
      return;
    }
    setMapCenter([loc.latitude, loc.longitude]);
    setShowMap(true);
    onPick(loc);
    setPending({ lat: loc.latitude, lng: loc.longitude });
  }

  async function handleClick(lat: number, lng: number) {
    setPending({ lat, lng });
    setLoadingAddress(true);
    const address = await reverseGeocode(lat, lng);
    setLoadingAddress(false);
    if (address) setAddressInput(address.split(',').slice(0, 3).join(',').trim());
    onPick({ latitude: lat, longitude: lng, address });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  }

  return (
    <div className="space-y-2">
      {/* Поле вводу адреси */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          <input
            ref={inputRef}
            value={addressInput}
            onChange={(e) => { setAddressInput(e.target.value); setSearchError(''); }}
            onKeyDown={handleKeyDown}
            placeholder="Введіть адресу або назву місця…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-200 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none text-sm transition"
          />
        </div>
        <button
          type="button"
          onClick={handleSearch}
          disabled={searching || !addressInput.trim()}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl btn-glass-blue text-sm font-semibold transition disabled:opacity-50 shrink-0"
        >
          {searching ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
        </button>
      </div>

      {searchError && (
        <p className="text-xs text-red-500 px-1">{searchError}</p>
      )}

      {/* Кнопка "Показати карту" */}
      <button
        type="button"
        onClick={() => setShowMap((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-semibold text-accent-600 hover:text-accent-700 transition"
      >
        {showMap ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {showMap ? 'Сховати карту' : 'Показати карту'}
      </button>

      {/* Карта */}
      {showMap && (
        <div
          className="rounded-xl overflow-hidden border border-neutral-100 relative"
          style={{ height }}
        >
          <div style={{ isolation: 'isolate', position: 'relative', height: '100%' }}>
            <MapContainer
              key={`${mapCenter[0]}-${mapCenter[1]}`}
              center={mapCenter}
              zoom={13}
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
            {loadingAddress ? 'Визначаю адресу…' : 'Клікніть по карті, щоб уточнити точку'}
          </div>
        </div>
      )}
    </div>
  );
}
