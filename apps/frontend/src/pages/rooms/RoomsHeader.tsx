import { useTranslation } from 'react-i18next';
import { Plus, Ampersand, Search, X } from 'lucide-react';
import { PageHeader } from '../../shared/ui';

interface RoomsHeaderProps {
  onCreateClick: () => void;
  onJoinClick: () => void;
  onSearchClick: () => void;
  searchOpen: boolean;
}

export function RoomsHeader({ onCreateClick, onJoinClick, onSearchClick, searchOpen }: RoomsHeaderProps) {
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
        <div className="flex items-center gap-1.5">
          <button
            onClick={onSearchClick}
            title={t('rooms.search')}
            aria-label={t('rooms.search')}
            className={`p-2 rounded-xl shadow-card transition ${
              searchOpen
                ? 'bg-accent-500 text-white'
                : 'bg-accent-50 text-accent-500 hover:bg-accent-100 hover:shadow-card-lg'
            }`}
          >
            {searchOpen ? <X size={20} /> : <Search size={20} />}
          </button>
          <button
            onClick={onCreateClick}
            title={t('common.create')}
            aria-label={t('common.create')}
            className="p-2 bg-brand-gradient hover:bg-brand-gradient-hover text-white rounded-xl transition"
          >
            <Plus size={20} />
          </button>
        </div>
      }
    />
  );
}
