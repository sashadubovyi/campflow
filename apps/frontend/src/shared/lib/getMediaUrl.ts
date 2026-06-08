/**
 * Нормалізує URL медіа з API.
 * - http(s)://, blob:, data: → повертає як є (вже абсолютний)
 * - '/uploads/...' або будь-який інший backend-шлях → префіксує VITE_API_URL
 *   (без хвостового /api, бо статика віддається з кореня, не з /api)
 * - null/undefined/'' → ''
 *
 * VITE_API_URL у dev зазвичай не задано → fallback http://localhost:3001.
 * У prod очікується щось на кшталт https://api.example.com (без /api на кінці).
 */
export function getMediaUrl(url?: string | null): string {
  if (!url) return '';
  if (/^(https?:|blob:|data:)/i.test(url)) return url;
  const apiOrigin = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001').replace(/\/+$/, '');
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${apiOrigin}${path}`;
}
