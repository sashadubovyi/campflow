/**
 * Shared Socket.IO CORS origin callback for all gateways.
 *
 * Gateway decorators evaluate at import time — before ConfigModule has loaded
 * .env — so the allowlist must be read lazily, per handshake. Mirrors the HTTP
 * CORS policy in main.ts: FRONTEND_URL is a comma-separated list, trailing
 * slashes ignored, localhost:5173 always allowed for dev.
 */
export function wsCorsOrigin(
  origin: string | undefined,
  cb: (err: Error | null, allow?: boolean) => void,
) {
  // No Origin header (native apps, server-to-server) — allow, same as HTTP CORS.
  if (!origin) return cb(null, true);

  const allowed = new Set(
    (process.env.FRONTEND_URL ?? '')
      .split(',')
      .map((s) => s.trim().replace(/\/+$/, ''))
      .filter(Boolean)
      .concat('http://localhost:5173'),
  );
  cb(null, allowed.has(origin.replace(/\/+$/, '')));
}
