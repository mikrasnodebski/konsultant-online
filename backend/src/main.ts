import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.use(json({ limit: '100mb' }));
  app.use(urlencoded({ limit: '100mb', extended: true }));
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));
  const allowedOrigins: (RegExp | string)[] = [
    /^http:\/\/localhost:\d+$/,
    /^http:\/\/127\.0\.0\.1:\d+$/,
    /^https:\/\/localhost:\d+$/,
    /^https:\/\/127\.0\.0\.1:\d+$/,
  ];
  const envOriginsRaw = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || '').trim();
  if (envOriginsRaw) {
    envOriginsRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((origin) => allowedOrigins.push(origin));
  }
  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });
  await app.listen(Number(process.env.PORT ?? 4000));
}
bootstrap();
