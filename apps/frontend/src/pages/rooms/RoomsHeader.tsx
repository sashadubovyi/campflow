import { useTranslation } from 'react-i18next';
import { Plus, Ampersand } from 'lucide-react';
import { PageHeader } from '../../shared/ui';

interface RoomsHeaderProps {
  onCreateClick: () => void;
  onJoinClick: () => void;
}

export function RoomsHeader({ onCreateClick, onJoinClick }: RoomsHeaderProps) {
  const { t } = useTranslation();
  return (
    <PageHeader
      title={t('rooms.title')}
      left={
        <button
          onClick={onJoinClick}
          title={t('rooms.join')}
          aria-label={t('rooms.join')}
          className="p-2 bg-accent-50 text-accent-500 rounded-xl shadow-card hover:bg-accent-100 hover:shadow-card-lg transition"
        >
          <Ampersand size={20} />
        </button>
      }
      right={
        <button
          onClick={onCreateClick}
          title={t('common.create')}
          aria-label={t('common.create')}
          className="p-2 bg-brand-gradient hover:bg-brand-gradient-hover text-white rounded-lg transition"
        >
          <Plus size={20} />
        </button>
      }
    />
  );
}
