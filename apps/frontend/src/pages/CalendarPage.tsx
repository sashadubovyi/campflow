import { Calendar } from 'lucide-react';

export function CalendarPage() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-3 text-neutral-400">
      <Calendar size={48} strokeWidth={1.5} />
      <p className="text-lg font-medium text-neutral-600">Календар</p>
      <p className="text-sm">Скоро тут зʼявляться події твоїх кімнат</p>
    </div>
  );
}
