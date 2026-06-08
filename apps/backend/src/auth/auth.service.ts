import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { JwtPayload } from './strategies/jwt.strategy';
import { toLatinSlug } from './utils/username';

interface TokensPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly BCRYPT_ROUNDS = 12;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto, meta: { userAgent?: string; ip?: string }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const username = await this.generateUniqueUsername(dto.email, dto.fullName);
    const passwordHash = await bcrypt.hash(dto.password, this.BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        username,
        passwordHash,
        phone: dto.phone,
      },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        avatarUrl: true,
        locale: true,
      },
    });

    const tokens = await this.issueTokens(user.id, user.email, meta);

    return { user, ...tokens };
  }

  async login(dto: LoginDto, meta: { userAgent?: string; ip?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      // Не раскрываем, существует ли email — одинаковая ошибка
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Backfill: для юзерів, зареєстрованих до правила 'username ASCII only',
    // нормалізуємо username при першому входи. Один раз на юзера.
    const normalizedUsername = await this.normalizeUsernameIfNeeded(
      user.id,
      user.username,
      user.email,
      user.fullName,
    );

    const tokens = await this.issueTokens(user.id, user.email, meta);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: normalizedUsername,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        locale: user.locale,
      },
      ...tokens,
    };
  }

  /**
   * Якщо поточний username має не-ASCII символи, генерує новий унікальний
   * латинський і апдейтить рядок у БД. Повертає актуальний username.
   */
  private async normalizeUsernameIfNeeded(
    userId: string,
    username: string,
    email: string,
    fullName: string,
  ): Promise<string> {
    if (/^[a-z0-9_-]+$/.test(username)) return username;

    this.logger.log(
      `Backfill: normalizing non-ASCII username "${username}" for user ${userId}`,
    );
    const next = await this.generateUniqueUsername(email, fullName);
    await this.prisma.user.update({
      where: { id: userId },
      data: { username: next, usernameChangedAt: new Date() },
    });
    return next;
  }

  async refresh(rawRefreshToken: string, meta: { userAgent?: string; ip?: string }) {
    const tokenHash = this.hashToken(rawRefreshToken);

    const stored = await this.prisma.refreshToken.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
      include: { user: true },
    });

    if (!stored) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Ротация: отзываем старый, выдаём новый
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(stored.user.id, stored.user.email, meta);
  }

  async logout(rawRefreshToken: string | undefined) {
    if (!rawRefreshToken) return;
    const tokenHash = this.hashToken(rawRefreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async issueTokens(
    userId: string,
    email: string,
    meta: { userAgent?: string; ip?: string },
  ): Promise<TokensPair> {
    const payload: JwtPayload = { sub: userId, email };

    const accessTtl = (this.config.get<string>('JWT_ACCESS_TTL') ??
      '15m') as `${number}${'s' | 'm' | 'h' | 'd'}`;

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: accessTtl,
    });

    const refreshToken = randomBytes(48).toString('hex');
    const refreshHash = this.hashToken(refreshToken);

    const refreshTtlDays = this.parseDurationDays(this.config.get<string>('JWT_REFRESH_TTL', '7d'));
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshTtlDays);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: refreshHash,
        userAgent: meta.userAgent,
        ip: meta.ip,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private parseDurationDays(value: string): number {
    const match = /^(\d+)d$/.exec(value);
    const days = match?.[1];
    if (!days) return 7;
    return parseInt(days, 10);
  }

  private async generateUniqueUsername(email: string, fullName?: string): Promise<string> {
    // Спершу пробуємо локальну частину email; для кириличних — транслітеруємо.
    // Якщо нічого корисного — пробуємо ПІБ. Якщо й там нема — 'user'.
    const fromEmail = toLatinSlug(email.split('@')[0] ?? '').slice(0, 24);
    const fromName = fullName ? toLatinSlug(fullName).slice(0, 24) : '';
    const base = fromEmail.length >= 2 ? fromEmail : fromName.length >= 2 ? fromName : 'user';

    let candidate = base;
    let exists = await this.prisma.user.findUnique({ where: { username: candidate } });
    if (!exists) return candidate;

    for (let i = 0; i < 5; i++) {
      const suffix = Math.random().toString(36).slice(2, 6);
      candidate = `${base}_${suffix}`.slice(0, 32);
      exists = await this.prisma.user.findUnique({ where: { username: candidate } });
      if (!exists) return candidate;
    }

    return `${base}_${Date.now().toString(36)}`.slice(0, 32);
  }
}
