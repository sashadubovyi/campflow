/**
 * Повертає URL медіа як відносний шлях.
 * - http(s)://, blob:, data: → залишаємо як є (вже абсолютний / блоб / data URI)
 * - все інше (включно з '/uploads/...') → повертаємо без змін
 *
 * Відносні шляхи проксюються Vite-сервером (див. vite.config.ts: proxy '/uploads')
 * у dev і обслуговуються тим самим origin у prod, тож працюють і на HTTPS
 * без mixed-content попереджень.
 */
export const getMediaUrl = (url?: string | null): string => {
  if (!url) return '';
  if (/^(https?:|blob:|data:)/i.test(url)) return url;
  return url;
};
