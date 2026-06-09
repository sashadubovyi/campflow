import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { useLang } from '../shared/lib/useLang';
import { BackButton, PageHeader, cn } from '../shared/ui';

const LANG_LABEL: Record<string, { native: string; flag: string }> = {
  uk: { native: 'Українська', flag: '🇺🇦' },
  en: { native: 'English', flag: '🇬🇧' },
  ru: { native: 'Русский', flag: '🇷🇺' },
};

export function LanguagePage() {
  const { t } = useTranslation();
  const { current, change, supported } = useLang();

  return (
    <div className="h-full flex flex-col bg-neutral-50 font-body">
      <PageHeader
        title={<span className="font-display">&amp; Language</span>}
        left={<BackButton />}
      />

      <main className="flex-1 overflow-y-auto w-full px-4 md:px-6 py-6">
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm divide-y divide-neutral-100 overflow-hidden">
          {supported.map((lang) => {
            const isActive = current === lang;
            const meta = LANG_LABEL[lang];
            return (
              <button
                key={lang}
                onClick={() => change(lang)}
                className={cn(
                  'w-full flex items-center gap-3 p-4 text-left transition',
                  isActive ? 'bg-accent-50/50' : 'hover:bg-neutral-50',
                )}
              >
                <span className="text-xl">{meta?.flag}</span>
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
