import { Module } from '@nestjs/common';
import { CallsheetsController } from './callsheets.controller';
import { CallsheetsService } from './callsheets.service';

@Module({
  controllers: [CallsheetsController],
  providers: [CallsheetsService],
  exports: [CallsheetsService],
})
export class CallsheetsModule {}
