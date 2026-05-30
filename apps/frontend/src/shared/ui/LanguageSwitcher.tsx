import { useState, useEffect, useRef } from 'react';
import { useLang } from '../lib/useLang';
import { useTranslation } from 'react-i18next';

const FLAG_CODES: Record<string, string> = {
  uk: 'ua',
  en: 'gb',
  ru: 'ru',
};

function FlagIcon({ lang }: { lang: string }) {
  const code = FLAG_CODES[lang] ?? 'ua';
  return (
    <img
      src={`https://flagcdn.com/24x18/${code}.png`}
      srcSet={`https://flagcdn.com/48x36/${code}.png 2x`}
      width="20"
      height="15"
      alt={lang}
      className="rounded-sm shrink-0"
    />
  );
}

export function LanguageSwitcher() {
  const { current, change, supported } = useLang();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-sm hover:bg-forest-50 rounded-lg px-2 py-1 transition flex items-center gap-1"
        title={t(`language.${current}`)}
      >
        <span><FlagIcon lang={current} /></span>
        <span className="text-xs text-forest-700 uppercase">{current}</span>
      </button>
      {open && (
        <ul className="absolute right-0 top-full mt-1 bg-white border border-forest-100 rounded-xl shadow-lg overflow-hidden z-50 min-w-[140px]">
          {supported.map((lang) => (
            <li key={lang}>
              <button
                onClick={() => {
                  change(lang);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-forest-50 transition flex items-center gap-2 ${
                  current === lang
                    ? 'bg-forest-50 text-forest-900 font-semibold'
                    : 'text-forest-700'
                }`}
              >
                <span><FlagIcon lang={lang} /></span>
                <span>{t(`language.${lang}`)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
