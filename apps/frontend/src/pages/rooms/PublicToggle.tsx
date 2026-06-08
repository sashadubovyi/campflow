import { useTranslation } from 'react-i18next';
import { Globe, Lock } from 'lucide-react';

interface Props {
  isPublic: boolean;
  onChange: (value: boolean) => void;
}

export function PublicToggle({ isPublic, onChange }: Props) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={() => onChange(!isPublic)}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-neutral-100 hover:border-accent-500/40 transition text-left"
    >
      <span
        className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
          isPublic ? 'bg-accent-50 text-accent-600' : 'bg-neutral-100 text-neutral-500'
        }`}
      >
        {isPublic ? <Globe size={16} /> : <Lock size={16} />}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-semibold text-neutral-900">
          {isPublic
            ? t('rooms.publicTitle', 'Публічна')
            : t('rooms.privateTitle', 'Приватна')}
        </span>
        <span className="block text-xs text-neutral-400 truncate">
          {isPublic
            ? t('rooms.publicHint', 'Видна всім у стрічці «&u»')
            : t('rooms.privateHint', 'Доступ тільки за запрошенням')}
        </span>
      </span>
      <span
        className={`shrink-0 w-9 h-5 rounded-full p-0.5 transition ${
          isPublic ? 'bg-accent-500' : 'bg-neutral-200'
        }`}
      >
        <span
          className={`block w-4 h-4 rounded-full bg-white transition-transform ${
            isPublic ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </span>
    </button>
  );
}
