import 'reflect-metadata';
import { webcrypto } from 'crypto';

if (!(globalThis as { crypto?: Crypto }).crypto) {
  (globalThis as { crypto?: Crypto }).crypto = webcrypto as unknown as Crypto;
}

import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ShotlistsService } from './shotlists/shotlists.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableShutdownHooks();
  app.useBodyParser('json', { limit: '2mb' });
  await app.get(ShotlistsService).attach(app.getHttpServer());

  app.enableCors({
    origin: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  });

  const port = Number(process.env.PORT || 3001);
  await app.listen(port, process.env.HOST || '0.0.0.0');
}
bootstrap();
