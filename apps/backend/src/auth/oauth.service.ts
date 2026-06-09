import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createPublicKey, createVerify } from 'crypto';
import type { OAuthProvider } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { toLatinSlug } from './utils/username';

interface VerifiedClaims {
  sub: string; // ID юзера в провайдера
  email: string | null;
  emailVerified: boolean;
  name: string | null;
  picture: string | null;
}

// Мінімалістична JWK-структура (RSA).
interface Jwk {
  kid: string;
  kty: string;
  alg?: string;
  use?: string;
  n: string;
  e: string;
}

interface JwksCacheEntry {
  fetchedAt: number;
  keys: Map<string, string>; // kid → PEM
}

const ONE_HOUR_MS = 60 * 60 * 1000;

@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);
  private readonly jwksCache = new Map<string, JwksCacheEntry>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  // ── Публічний API ────────────────────────────────────────────────────────

  async verifyGoogleIdToken(idToken: string): Promise<VerifiedClaims> {
    const clientId = this.config.get<string>('GOOGLE_OAUTH_CLIENT_ID');
    if (!clientId) {
      throw new UnauthorizedException('Google OAuth is not configured on this server');
    }
    const payload = await this.verifyJwt(idToken, {
      jwksUrl: 'https://www.googleapis.com/oauth2/v3/certs',
      issuers: ['https://accounts.google.com', 'accounts.google.com'],
      audience: clientId,
    });
    return {
      sub: String(payload.sub),
      email: typeof payload.email === 'string' ? payload.email : null,
      emailVerified: payload.email_verified === true || payload.email_verified === 'true',
      name: typeof payload.name === 'string' ? payload.name : null,
      picture: typeof payload.picture === 'string' ? payload.picture : null,
    };
  }

  async verifyAppleIdToken(idToken: string): Promise<VerifiedClaims> {
    const clientId = this.config.get<string>('APPLE_OAUTH_CLIENT_ID');
    if (!clientId) {
      throw new UnauthorizedException('Apple OAuth is not configured on this server');
    }
    const payload = await this.verifyJwt(idToken, {
      jwksUrl: 'https://appleid.apple.com/auth/keys',
      issuers: ['https://appleid.apple.com'],
      audience: clientId,
    });
    return {
      sub: String(payload.sub),
      email: typeof payload.email === 'string' ? payload.email : null,
      emailVerified:
        payload.email_verified === true ||
        payload.email_verified === 'true' ||
        payload.is_private_email === true,
      // Apple НЕ повертає name в id_token. При першому логіні фронт
      // отримує user.name окремим полем — кладемо у БД через fullName з фронта.
      name: null,
      picture: null,
    };
  }

  /**
   * Facebook працює не через OIDC id_token, а через короткий access_token
   * від Web SDK. Валідуємо через Graph debug_token (потрібен app_secret) і
   * витягуємо профіль через /me.
   */
  async verifyFacebookAccessToken(accessToken: string): Promise<VerifiedClaims> {
    const appId = this.config.get<string>('FACEBOOK_OAUTH_CLIENT_ID');
    const appSecret = this.config.get<string>('FACEBOOK_OAUTH_CLIENT_SECRET');
    if (!appId || !appSecret) {
      throw new UnauthorizedException('Facebook OAuth is not configured on this server');
    }

    // 1. Перевірити що токен виданий саме нашому app і він активний.
    const debugUrl =
      'https://graph.facebook.com/debug_token' +
      `?input_token=${encodeURIComponent(accessToken)}` +
      `&access_token=${encodeURIComponent(`${appId}|${appSecret}`)}`;
    let debugRes: Response;
    try {
      debugRes = await fetch(debugUrl);
    } catch (err) {
      this.logger.error('Facebook debug_token fetch failed', err as Error);
      throw new UnauthorizedException('OAuth provider unavailable');
    }
    if (!debugRes.ok) {
      throw new UnauthorizedException('Invalid Facebook token');
    }
    const debugJson = (await debugRes.json()) as {
      data?: { app_id?: string; is_valid?: boolean; user_id?: string; expires_at?: number };
    };
    const data = debugJson.data;
    if (!data?.is_valid || data.app_id !== appId || !data.user_id) {
      throw new UnauthorizedException('Invalid Facebook token');
    }
    if (data.expires_at !== undefined && data.expires_at !== 0) {
      const now = Math.floor(Date.now() / 1000);
      if (data.expires_at < now) throw new UnauthorizedException('Facebook token expired');
    }

    // 2. appsecret_proof захищає /me запит від підміни.
    const { createHmac } = await import('crypto');
    const appsecretProof = createHmac('sha256', appSecret).update(accessToken).digest('hex');
    const meUrl =
      'https://graph.facebook.com/v18.0/me' +
      '?fields=id,email,name,picture.type(large)' +
      `&access_token=${encodeURIComponent(accessToken)}` +
      `&appsecret_proof=${appsecretProof}`;
    let meRes: Response;
    try {
      meRes = await fetch(meUrl);
    } catch (err) {
      this.logger.error('Facebook /me fetch failed', err as Error);
      throw new UnauthorizedException('OAuth provider unavailable');
    }
    if (!meRes.ok) {
      throw new UnauthorizedException('Facebook profile fetch failed');
    }
    const me = (await meRes.json()) as {
      id?: string;
      email?: string;
      name?: string;
      picture?: { data?: { url?: string } };
    };
    if (!me.id || me.id !== data.user_id) {
      throw new UnauthorizedException('Facebook user mismatch');
    }

    return {
      sub: me.id,
      email: typeof me.email === 'string' ? me.email : null,
      // Facebook гарантує, що повертає email тільки якщо юзер його верифікував
      // і дав scope=email — тому довіряємо.
      emailVerified: !!me.email,
      name: typeof me.name === 'string' ? me.name : null,
      picture: me.picture?.data?.url ?? null,
    };
  }

  /** Знаходить або створює юзера за OAuth-claims; повертає user. */
  async findOrCreateUserFromOAuth(
    provider: OAuthProvider,
    claims: VerifiedClaims,
    fallbackName?: string,
  ): Promise<{ userId: string; email: string; isNew: boolean }> {
    // 1. Шукаємо за існуючою oauth_identity (швидкий шлях).
    const existing = await this.prisma.oAuthIdentity.findUnique({
      where: { provider_providerUserId: { provider, providerUserId: claims.sub } },
      include: { user: { select: { id: true, email: true } } },
    });
    if (existing) {
      return { userId: existing.user.id, email: existing.user.email, isNew: false };
    }

    // 2. Якщо є email — пробуємо прив'язати до існуючого юзера з тим email
    //    (тільки якщо email верифікований провайдером, інакше це atakka).
    if (claims.email && claims.emailVerified) {
      const byEmail = await this.prisma.user.findUnique({
        where: { email: claims.email.toLowerCase() },
        select: { id: true, email: true },
      });
      if (byEmail) {
        await this.prisma.oAuthIdentity.create({
          data: {
            userId: byEmail.id,
            provider,
            providerUserId: claims.sub,
            email: claims.email,
          },
        });
        return { userId: byEmail.id, email: byEmail.email, isNew: false };
      }
    }

    // 3. Створюємо нового юзера. Email потрібен; Apple Private Relay дає
    //    'random@privaterelay.appleid.com', все одно унікальний.
    if (!claims.email) {
      throw new BadRequestException(
        'OAuth provider did not return an email — cannot create account',
      );
    }
    const email = claims.email.toLowerCase();
    const fullName = (claims.name ?? fallbackName ?? email.split('@')[0])!.trim();
    const username = await this.generateUniqueUsername(email, fullName);

    const newUser = await this.prisma.user.create({
      data: {
        email,
        username,
        fullName,
        avatarUrl: claims.picture,
        passwordHash: null,
        oauthIdentities: {
          create: {
            provider,
            providerUserId: claims.sub,
            email: claims.email,
          },
        },
      },
      select: { id: true, email: true },
    });

    return { userId: newUser.id, email: newUser.email, isNew: true };
  }

  // ── Internals ────────────────────────────────────────────────────────────

  private async generateUniqueUsername(email: string, fullName: string): Promise<string> {
    const fromEmail = toLatinSlug(email.split('@')[0] ?? '').slice(0, 24);
    const fromName = toLatinSlug(fullName).slice(0, 24);
    const base = fromEmail.length >= 2 ? fromEmail : fromName.length >= 2 ? fromName : 'user';

    let candidate = base;
    let exists = await this.prisma.user.findUnique({ where: { username: candidate } });
    if (!exists) return candidate;
    for (let i = 0; i < 5; i++) {
      candidate = `${base}_${Math.random().toString(36).slice(2, 6)}`.slice(0, 32);
      exists = await this.prisma.user.findUnique({ where: { username: candidate } });
      if (!exists) return candidate;
    }
    return `${base}_${Date.now().toString(36)}`.slice(0, 32);
  }

  /** Верифікує id_token: підпис (RS256), iss, aud, exp. */
  private async verifyJwt(
    idToken: string,
    opts: { jwksUrl: string; issuers: string[]; audience: string },
  ): Promise<Record<string, unknown>> {
    const parts = idToken.split('.');
    if (parts.length !== 3) throw new UnauthorizedException('Malformed id_token');

    const [headerB64, payloadB64, signatureB64] = parts as [string, string, string];
    const header = this.decodeJsonPart<{ alg: string; kid: string }>(headerB64);
    const payload = this.decodeJsonPart<Record<string, unknown>>(payloadB64);

    if (header.alg !== 'RS256') {
      throw new UnauthorizedException(`Unsupported alg: ${header.alg}`);
    }

    const pem = await this.getKey(opts.jwksUrl, header.kid);
    const signature = Buffer.from(signatureB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    const verify = createVerify('RSA-SHA256');
    verify.update(`${headerB64}.${payloadB64}`);
    verify.end();
    if (!verify.verify(pem, signature)) {
      throw new UnauthorizedException('Invalid id_token signature');
    }

    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp === 'number' && payload.exp < now) {
      throw new UnauthorizedException('id_token expired');
    }
    if (typeof payload.iat === 'number' && payload.iat > now + 300) {
      throw new UnauthorizedException('id_token issued in the future');
    }
    if (!opts.issuers.includes(String(payload.iss))) {
      throw new UnauthorizedException('Invalid issuer');
    }
    // aud може бути string або array of strings.
    const aud = payload.aud;
    const audOk =
      aud === opts.audience ||
      (Array.isArray(aud) && aud.some((a) => a === opts.audience));
    if (!audOk) {
      throw new UnauthorizedException('Invalid audience');
    }
    return payload;
  }

  private decodeJsonPart<T>(b64: string): T {
    const padded = b64.replace(/-/g, '+').replace(/_/g, '/');
    const buf = Buffer.from(padded, 'base64');
    return JSON.parse(buf.toString('utf8')) as T;
  }

  /** Bере публічний ключ за kid з JWKS, кешує на годину. */
  private async getKey(jwksUrl: string, kid: string): Promise<string> {
    const cached = this.jwksCache.get(jwksUrl);
    if (cached && Date.now() - cached.fetchedAt < ONE_HOUR_MS) {
      const pem = cached.keys.get(kid);
      if (pem) return pem;
    }
    const fresh = await this.fetchJwks(jwksUrl);
    this.jwksCache.set(jwksUrl, { fetchedAt: Date.now(), keys: fresh });
    const pem = fresh.get(kid);
    if (!pem) throw new UnauthorizedException(`Unknown JWKS kid: ${kid}`);
    return pem;
  }

  private async fetchJwks(jwksUrl: string): Promise<Map<string, string>> {
    let res: Response;
    try {
      res = await fetch(jwksUrl);
    } catch (err) {
      this.logger.error(`JWKS fetch failed: ${jwksUrl}`, err as Error);
      throw new UnauthorizedException('OAuth provider unavailable');
    }
    if (!res.ok) {
      throw new UnauthorizedException(`JWKS HTTP ${res.status}`);
    }
    const json = (await res.json()) as { keys: Jwk[] };
    const map = new Map<string, string>();
    for (const jwk of json.keys ?? []) {
      if (jwk.kty !== 'RSA') continue;
      try {
        const pubKey = createPublicKey({ key: jwk as never, format: 'jwk' });
        const pem = pubKey.export({ type: 'spki', format: 'pem' }) as string;
        map.set(jwk.kid, pem);
      } catch (err) {
        this.logger.warn(`Skip JWK kid=${jwk.kid}: ${(err as Error).message}`);
      }
    }
    return map;
  }
}
