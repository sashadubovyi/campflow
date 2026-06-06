import { Calendar } from 'lucide-react';
import { PageHeader } from '../shared/ui';
import { useTranslation } from 'react-i18next';

export function CalendarPage() {
  const { t } = useTranslation();
  return (
    <div className="h-full flex flex-col">
      <PageHeader title={t('nav.calendar') ?? 'Календар'} />
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-neutral-400">
        <Calendar size={48} strokeWidth={1.5} />
        <p className="text-lg font-medium text-neutral-600">{t('nav.calendar') ?? 'Календар'}</p>
        <p className="text-sm">Скоро тут зʼявляться події твоїх кімнат</p>
      </div>
    </div>
  );
}
