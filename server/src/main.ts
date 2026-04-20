import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:5173',
      'https://vaderwhiteout.com',
      'https://vaderwhiteout.com/ADConsole'
    ],
    credentials: true,
  });

  const port = Number(process.env.PORT || 3001);
  await app.listen(port);
}
bootstrap();
