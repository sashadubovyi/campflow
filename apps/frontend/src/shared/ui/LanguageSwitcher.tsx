import { useState, useEffect, useRef } from 'react';
import { useLang } from '../lib/useLang';
import { useTranslation } from 'react-i18next';

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
        className="flex items-center justify-center w-11 h-11 rounded-xl text-xs font-semibold uppercase bg-gemini-active border border-accent-200/40 text-accent-600 hover:bg-gemini-active-hover transition-all duration-200"
        title={t(`language.${current}`)}
      >
        {current}
      </button>
      {open && (
        <ul className="absolute right-0 top-full mt-1 bg-white border border-neutral-100 rounded-xl shadow-lg overflow-hidden z-50 min-w-[140px]">
          {supported.map((lang) => (
            <li key={lang}>
              <button
                onClick={() => {
                  change(lang);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 transition flex items-center gap-2 ${
                  current === lang
                    ? 'bg-neutral-50 text-neutral-900 font-semibold'
                    : 'text-neutral-700'
                }`}
              >
                <span>{t(`language.${lang}`)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
