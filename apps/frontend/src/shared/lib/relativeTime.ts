/**
 * Повертає короткий відносний час: "5 хв тому", "вчора", "3 дні тому".
 * Для глибшого минулого — дата у форматі "12 черв.".
 */
export function relativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 30) return 'щойно';
  if (diffMin < 1) return `${diffSec} с тому`;
  if (diffMin < 60) return `${diffMin} хв тому`;
  if (diffHour < 24) return `${diffHour} год тому`;
  if (diffDay === 1) return 'вчора';
  if (diffDay < 7) return `${diffDay} дн тому`;

  return date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });
}
