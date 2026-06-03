import { useTranslation } from 'react-i18next';
import { Plus, LogIn } from 'lucide-react';

interface RoomsHeaderProps {
  onCreateClick: () => void;
  onJoinClick: () => void;
}

export function RoomsHeader({ onCreateClick, onJoinClick }: RoomsHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-6 text-center">
      <h2 className="font-display text-lg font-bold text-neutral-900 mb-4">{t('rooms.title')}</h2>
      <div className="flex gap-2">
        <button
          onClick={onCreateClick}
          className="flex-1 flex items-center justify-center gap-2 bg-brand-gradient hover:bg-brand-gradient-hover text-white font-semibold py-2.5 rounded-xl transition"
        >
          <Plus size={16} />
          {t('common.create')}
        </button>
        <button
          onClick={onJoinClick}
          className="flex-1 flex items-center justify-center gap-2 bg-white text-neutral-700 border border-neutral-200 font-semibold py-2.5 rounded-xl hover:bg-neutral-50 transition"
        >
          <LogIn size={16} />
          {t('rooms.join')}
        </button>
      </div>
    </div>
  );
}
