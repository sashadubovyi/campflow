import { Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../shared/ui';

export function CalendarPage() {
  const { t } = useTranslation();
  return (
    <div className="h-full flex flex-col">
      <PageHeader title={<span className="font-display">{t('nav.titles.calendar')}</span>} />
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-neutral-400">
        <Calendar size={48} strokeWidth={1.5} />
        <p className="text-lg font-medium text-neutral-600">{t('nav.titles.calendar')}</p>
        <p className="text-sm">{t('calendar.soon', 'Скоро тут зʼявляться події твоїх кімнат')}</p>
      </div>
    </div>
  );
}
