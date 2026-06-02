import { Map } from 'lucide-react';

export function MapPage() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-3 text-neutral-400 px-6 text-center">
      <Map size={48} strokeWidth={1.5} />
      <p className="text-lg font-medium text-neutral-600">Карта</p>
      <p className="text-sm">Скоро тут зʼявляться кімнати на карті</p>
    </div>
  );
}
