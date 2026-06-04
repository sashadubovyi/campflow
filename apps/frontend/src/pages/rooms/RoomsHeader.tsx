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
          className="group flex items-center bg-accent-50 text-accent-500 rounded-xl shadow-card hover:bg-accent-100 hover:shadow-card-lg transition-all duration-300 overflow-hidden px-2 py-2"
        >
          <Ampersand size={20} className="shrink-0" />
          {/* Текст тільки на десктопі */}
          <span className="hidden md:block max-w-0 md:group-hover:max-w-[120px] overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out text-sm font-semibold md:group-hover:ml-1.5">
            {t('rooms.join')}
          </span>
        </button>
      }
      right={
        <div className="flex items-center gap-1.5">
          <button
            onClick={onCreateClick}
            title={t('common.create')}
            className="group flex items-center bg-brand-gradient hover:bg-brand-gradient-hover text-white rounded-xl transition-all duration-300 overflow-hidden px-2 py-2"
          >
            {/* Текст тільки на десктопі */}
            <span className="hidden md:block max-w-0 md:group-hover:max-w-[120px] overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out text-sm font-semibold md:group-hover:mr-1.5">
              {t('common.create')}
            </span>
            <Plus size={20} className="shrink-0" />
          </button>
          <button
            onClick={onSearchClick}
            title={t('rooms.search')}
            className={`p-2 rounded-xl shadow-card transition ${
              searchOpen
                ? 'bg-accent-500 text-white'
                : 'bg-accent-50 text-accent-500 hover:bg-accent-100 hover:shadow-card-lg'
            }`}
          >
            {searchOpen ? <X size={20} /> : <Search size={20} />}
          </button>
        </div>
      }
    />
  );
}
