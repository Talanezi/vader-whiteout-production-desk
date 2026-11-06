import { randomUUID } from 'crypto';
import { FlowsService } from './flows/flows.service';
import 'reflect-metadata';
import { webcrypto } from 'crypto';

if (!(globalThis as { crypto?: Crypto }).crypto) {
  (globalThis as { crypto?: Crypto }).crypto =
    webcrypto as unknown as Crypto;
}

import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { StoryboardsService } from './storyboards/storyboards.service';
import { ShotlistsService } from './shotlists/shotlists.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableShutdownHooks();
  app.use((req: any, res: any, next: () => void) => {
    const id = randomUUID(),
      at = Date.now();
    res.setHeader('X-Request-ID', id);
    res.setHeader('Cache-Control', 'no-store, private');
    res.on('finish', () => {
      if (res.statusCode >= 500 || Date.now() - at > 5000)
        console.warn(
          JSON.stringify({
            type: 'request',
            requestId: id,
            method: req.method,
            category: String(
              req.route?.path || req.path.split('/').slice(0, 3).join('/'),
            ),
            status: res.statusCode,
            ms: Date.now() - at,
            revision: process.env.RAILWAY_GIT_COMMIT_SHA || 'local',
            at: new Date().toISOString(),
          }),
        );
    });
    next();
  });
  app.useBodyParser('json', { limit: '2mb' });
  await app.get(ShotlistsService).attach(app.getHttpServer());

  await app.get(StoryboardsService).attach(app.getHttpServer());

  await app.get(FlowsService).attach(app.getHttpServer());

  app.enableCors({
    origin: [
      'https://vaderwhiteout.com',
      'https://www.vaderwhiteout.com',
      ...(process.env.SHOTLIST_ALLOWED_ORIGINS || '')
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean),
    ],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
    exposedHeaders: ['X-Request-ID', 'Retry-After'],
  });

  const port = Number(process.env.PORT || 3001);
  await app.listen(port, process.env.HOST || '0.0.0.0');
}
bootstrap();
