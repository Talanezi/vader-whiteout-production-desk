import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { SchedulerAuthGuard } from '../auth/scheduler-auth.guard';
import { CallsheetsService } from './callsheets.service';
import { CallSheetDraft } from './callsheet.types';

@UseGuards(SchedulerAuthGuard)
@Controller('api/callsheets')
export class CallsheetsController {
  constructor(private readonly callsheetsService: CallsheetsService) {}

  @Get()
  list() {
    return this.callsheetsService.list();
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.callsheetsService.getById(id);
  }

  @Post()
  create(
    @Req() req: Request & { user?: { userID: number } },
    @Body() payload: Partial<CallSheetDraft>,
  ) {
    return this.callsheetsService.create(req.user?.userID ?? null, payload);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() payload: Partial<CallSheetDraft>) {
    return this.callsheetsService.update(id, payload);
  }
}
