import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getHealth() {
    let dbStatus: 'ok' | 'error' = 'ok';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      this.logger.error('Database health check failed', error);
      dbStatus = 'error';
    }

    return {
      status: dbStatus === 'ok' ? 'ok' : 'degraded',
      service: 'andu-backend',
      checks: {
        database: dbStatus,
      },
      // Видно тільки факт наявності — без значень. Корисно при дебагу 502/OAuth.
      configured: {
        google: !!process.env.GOOGLE_OAUTH_CLIENT_ID,
        apple: !!process.env.APPLE_OAUTH_CLIENT_ID,
        facebook:
          !!process.env.FACEBOOK_OAUTH_CLIENT_ID && !!process.env.FACEBOOK_OAUTH_CLIENT_SECRET,
        gemini: !!process.env.GEMINI_API_KEY,
        cors: !!process.env.FRONTEND_URL,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
