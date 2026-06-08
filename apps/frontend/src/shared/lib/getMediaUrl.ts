export const getMediaUrl = (url?: string | null): string =>
  url?.startsWith('/uploads')
    ? `${import.meta.env.VITE_API_URL ?? 'http://localhost:3001'}${url}`
    : (url ?? '');
