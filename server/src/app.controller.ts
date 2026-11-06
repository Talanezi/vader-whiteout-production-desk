import {
  Controller,
  Get,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppService } from './app.service';
@Controller('api')
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly db: DataSource,
  ) {}
  @Get('health') getHealth() {
    return {
      ...this.appService.getHealth(),
      revision: process.env.RAILWAY_GIT_COMMIT_SHA || 'local',
    };
  }
  @Get('ready') async ready() {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        this.db.query('SELECT 1'),
        new Promise((_, reject) => {
          timer = setTimeout(() => reject(Error('timeout')), 3000);
        }),
      ]);
      return {
        ok: true,
        service: 'production-desk',
        database: 'ready',
        collaboration: 'initialized',
        revision: process.env.RAILWAY_GIT_COMMIT_SHA || 'local',
      };
    } catch {
      throw new ServiceUnavailableException(
        'Service is temporarily unavailable. Please retry.',
      );
    } finally {
      clearTimeout(timer);
    }
  }
}
