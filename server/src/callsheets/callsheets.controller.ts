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
  list(@Req() req: Request & { user: { userID: number } }) {
    return this.callsheetsService.list(req.user.userID);
  }

  @Get(':id')
  getById(
    @Req() req: Request & { user: { userID: number } },
    @Param('id') id: string,
  ) {
    return this.callsheetsService.getById(req.user.userID, id);
  }

  @Post()
  create(
    @Req() req: Request & { user: { userID: number } },
    @Body() payload: Partial<CallSheetDraft>,
  ) {
    return this.callsheetsService.create(req.user.userID, payload);
  }

  @Put(':id')
  update(
    @Req() req: Request & { user: { userID: number } },
    @Param('id') id: string,
    @Body() payload: Partial<CallSheetDraft>,
  ) {
    return this.callsheetsService.update(req.user.userID, id, payload);
  }
}
