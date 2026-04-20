import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CallsheetsController } from './callsheets.controller';
import { CallsheetsService } from './callsheets.service';
import { CallSheetDraftEntity } from './entities/callsheet-draft.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CallSheetDraftEntity])],
  controllers: [CallsheetsController],
  providers: [CallsheetsService],
  exports: [CallsheetsService],
})
export class CallsheetsModule {}
