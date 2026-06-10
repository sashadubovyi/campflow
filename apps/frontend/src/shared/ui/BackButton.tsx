import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface BackButtonProps {
  to?: string;
}

export function BackButton({ to }: BackButtonProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <button
      onClick={() => (to ? navigate(to) : navigate(-1))}
      className="flex items-center gap-1 text-sm font-semibold text-accent-600 hover:text-accent-500 transition-colors"
    >
      <ChevronLeft size={20} strokeWidth={2.5} />
      <span className="hidden sm:inline">{t('common.back')}</span>
    </button>
  );
}
