import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function BackButton() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <button
      onClick={() => navigate(-1)}
      className="flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-900 transition"
    >
      <ChevronLeft size={18} />
      <span className="hidden sm:inline">{t('common.back')}</span>
    </button>
  );
}
