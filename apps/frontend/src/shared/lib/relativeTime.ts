import i18n from '../../i18n';

const LOCALE_BY_LANG: Record<string, string> = {
  uk: 'uk-UA',
  en: 'en-US',
  ru: 'ru-RU',
};

function activeLocale(): string {
  return LOCALE_BY_LANG[i18n.language] ?? 'uk-UA';
}

/**
 * Повертає короткий відносний час мовою інтерфейсу: "5 хв. тому" / "5 min ago".
 * Для глибшого минулого — коротка дата ("12 черв." / "Jun 12").
 */
export function relativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  const locale = activeLocale();
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'narrow' });

  if (diffSec < 30) return rtf.format(0, 'second'); // "щойно" / "now"
  if (diffMin < 1) return rtf.format(-diffSec, 'second');
  if (diffMin < 60) return rtf.format(-diffMin, 'minute');
  if (diffHour < 24) return rtf.format(-diffHour, 'hour');
  if (diffDay < 7) return rtf.format(-diffDay, 'day'); // numeric:'auto' дає "вчора"/"yesterday"

  return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}
