/**
 * Повертає повний URL медіафайлу.
 * - http(s)://, blob:, data: → залишаємо як є
 * - відносні шляхи (/uploads/...) → додаємо VITE_API_URL як базу,
 *   якщо він задений. У dev Vite-проксі forwarda /uploads → бекенд;
 *   у prod (Vercel rewrite) теж або через прямий VITE_API_URL.
 */
export const getMediaUrl = (url?: string | null): string => {
  if (!url) return '';
  if (/^(https?:|blob:|data:)/i.test(url)) return url;
  const apiBase: string = (import.meta.env.VITE_API_URL as string) ?? '';
  const clean = apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase;
  return clean ? `${clean}${url}` : url;
};
