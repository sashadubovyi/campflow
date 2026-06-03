import { useTranslation } from 'react-i18next';

interface RoomsEmptyProps {
  onCreateClick: () => void;
}

export function RoomsEmpty({ onCreateClick }: RoomsEmptyProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-card shadow-card p-10 text-center">
      <p className="text-lg text-neutral-900 mb-1">{t('rooms.empty')}</p>
      <p className="text-neutral-600 text-sm mb-5">{t('rooms.emptyHint')}</p>
      <button
        onClick={onCreateClick}
        className="bg-brand-gradient hover:bg-brand-gradient-hover text-white font-semibold px-5 py-2.5 rounded-xl transition"
      >
        {t('rooms.createNew')}
      </button>
    </div>
  );
}
