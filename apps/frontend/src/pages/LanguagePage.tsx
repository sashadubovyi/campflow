import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { useLang } from '../shared/lib/useLang';
import { BackButton, PageHeader, cn } from '../shared/ui';

// Змінення: видалені emoji-прапори, замість них — двобуквенні коди
const LANG_LABEL: Record<string, { native: string; code: string }> = {
  uk: { native: 'Українська', code: 'UA' },
  en: { native: 'English',    code: 'EN' },
  ru: { native: 'Русский',    code: 'RU' },
};

export function LanguagePage() {
  const { t } = useTranslation();
  const { current, change, supported } = useLang();

  return (
    <div className="h-full flex flex-col font-body">
      <PageHeader
        title={<span className="font-display">{t('nav.titles.language')}</span>}
        left={<BackButton />}
      />

      <main className="flex-1 overflow-y-auto w-full px-4 md:px-6 py-6">
        <div className="glass-card shadow-sm divide-y divide-white/40 overflow-hidden">
          {supported.map((lang) => {
            const isActive = current === lang;
            const meta = LANG_LABEL[lang];
            return (
              <button
                key={lang}
                onClick={() => change(lang)}
                className={cn(
                  'w-full flex items-center gap-3 p-4 text-left transition',
                  isActive ? 'bg-accent-500/10' : 'hover:bg-white/50',
                )}
              >
                {/* Letter code badge */}
                <span
                  className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-bold tracking-wider shrink-0',
                    isActive
                      ? 'bg-accent-500/15 text-accent-700 border border-accent-500/30'
                      : 'bg-white/55 border border-white/70 text-neutral-600',
                  )}
                >
                  {meta?.code ?? lang.toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-neutral-900">{meta?.native ?? lang}</p>
                  <p className="text-xs text-neutral-400">{t(`language.${lang}`)}</p>
                </div>
                {isActive && <Check size={18} className="text-accent-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
