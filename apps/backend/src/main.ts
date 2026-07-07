import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

function parseAllowedOrigins(input: string | undefined): string[] {
  if (!input) return [];
  return input
    .split(',')
    .map((s) => s.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: false,
  });
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Trust proxy потрібен щоб req.protocol/req.secure коректно працювали
  // за Railway/Vercel/Nginx (інакше secure-cookie не виставиться).
  app.set('trust proxy', 1);

  app.setGlobalPrefix('api');
  // /uploads більше не сервиться: обкладинки й аватарки живуть у БД як
  // base64 data URL (диск на Railway ефемерний, файли зникали після deploy).
  app.use(
    helmet({
      // API повертає тільки JSON — сувора CSP тут страхує від відображення
      // будь-якого відбитого контенту як HTML. CSP для самого SPA — у vercel.json.
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS: FRONTEND_URL може бути кома-розділений список (prod + preview-домени).
  // Завжди дозволяємо localhost:5173 для dev. Хвостові слеші ігноруємо.
  const allowedOrigins = [
    ...parseAllowedOrigins(config.get<string>('FRONTEND_URL')),
    'http://localhost:5173',
  ];
  app.enableCors({
    origin: (origin, cb) => {
      // Запит без Origin (curl, same-origin, server-to-server) — дозволяємо.
      if (!origin) return cb(null, true);
      const normalized = origin.replace(/\/+$/, '');
      if (allowedOrigins.includes(normalized)) return cb(null, true);
      logger.warn(`CORS blocked origin: ${origin}`);
      return cb(new Error(`Origin not allowed: ${origin}`), false);
    },
    credentials: true,
  });

  // Healthcheck-friendly: HTTP listening має статись ASAP, інакше Railway/Vercel
  // дають 502 поки app не відповідає.
  const port = Number(config.get<number>('PORT', 3001));
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 &u backend listening on :${port} (NODE_ENV=${process.env.NODE_ENV ?? 'dev'})`);
  logger.log(`   CORS allowlist: ${allowedOrigins.join(', ')}`);
}

bootstrap().catch((err) => {
  console.error('FATAL bootstrap error:', err);
  process.exit(1);
});
