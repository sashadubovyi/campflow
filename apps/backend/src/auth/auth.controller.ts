import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { OAuthService } from './oauth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { OAuthLoginDto } from './dto/oauth.dto';
import { Public } from './decorators/public.decorator';
import { Get } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from './decorators/current-user.decorator';

const REFRESH_COOKIE = 'refresh_token';
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7d

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly oauth: OAuthService,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(dto, this.getMeta(req));
    this.setRefreshCookie(res, result.refreshToken);
    return { user: result.user, accessToken: result.accessToken, refreshToken: result.refreshToken };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto, this.getMeta(req));
    this.setRefreshCookie(res, result.refreshToken);
    return { user: result.user, accessToken: result.accessToken, refreshToken: result.refreshToken };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    // Приймаємо токен із cookie (desktop) АБО із тіла запиту (mobile Safari,
    // де cross-site httpOnly cookies блокуються ITP).
    const token =
      (req.cookies?.[REFRESH_COOKIE] as string | undefined) ??
      (req.body as Record<string, string> | undefined)?.refreshToken;
    if (!token) {
      throw new UnauthorizedException('No refresh token');
    }
    const tokens = await this.authService.refresh(token, this.getMeta(req));
    this.setRefreshCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
  }

  @Public()
  @Post('oauth/google')
  @HttpCode(HttpStatus.OK)
  async oauthGoogle(
    @Body() dto: OAuthLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const claims = await this.oauth.verifyGoogleIdToken(dto.idToken);
    const { userId } = await this.oauth.findOrCreateUserFromOAuth('google', claims, dto.fullName);
    const result = await this.authService.loginUserById(userId, this.getMeta(req));
    this.setRefreshCookie(res, result.refreshToken);
    return { user: result.user, accessToken: result.accessToken, refreshToken: result.refreshToken };
  }

  @Public()
  @Post('oauth/apple')
  @HttpCode(HttpStatus.OK)
  async oauthApple(
    @Body() dto: OAuthLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const claims = await this.oauth.verifyAppleIdToken(dto.idToken);
    const { userId } = await this.oauth.findOrCreateUserFromOAuth('apple', claims, dto.fullName);
    const result = await this.authService.loginUserById(userId, this.getMeta(req));
    this.setRefreshCookie(res, result.refreshToken);
    return { user: result.user, accessToken: result.accessToken, refreshToken: result.refreshToken };
  }

  /** Facebook використовує не id_token, а access_token. DTO.idToken = FB access token. */
  @Public()
  @Post('oauth/facebook')
  @HttpCode(HttpStatus.OK)
  async oauthFacebook(
    @Body() dto: OAuthLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const claims = await this.oauth.verifyFacebookAccessToken(dto.idToken);
    const { userId } = await this.oauth.findOrCreateUserFromOAuth('facebook', claims, dto.fullName);
    const result = await this.authService.loginUserById(userId, this.getMeta(req));
    this.setRefreshCookie(res, result.refreshToken);
    return { user: result.user, accessToken: result.accessToken, refreshToken: result.refreshToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.[REFRESH_COOKIE];
    await this.authService.logout(token);
    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie(REFRESH_COOKIE, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/api/auth',
    });
  }

  private setRefreshCookie(res: Response, token: string) {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      // У prod фронт (Vercel) і бек (Railway) на різних доменах — це cross-site.
      // SameSite=None дозволяє cookie у cross-site XHR (потрібен Secure=true).
      // У dev обидва на localhost → достатньо Lax.
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: REFRESH_COOKIE_MAX_AGE,
      path: '/api/auth',
    });
  }

  private getMeta(req: Request) {
    return {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    };
  }

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }
}
