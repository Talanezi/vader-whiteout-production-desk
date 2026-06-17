import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { SchedulerAuthGuard } from '../auth/scheduler-auth.guard';
import { RosterPerson } from '../callsheets/callsheet.types';
import { RosterService } from './roster.service';

@UseGuards(SchedulerAuthGuard)
@Controller('api/roster')
export class RosterController {
  constructor(private readonly rosterService: RosterService) {}

  @Get()
  list(@Req() req: Request & { user: { userID: number } }) {
    return this.rosterService.list(req.user.userID);
  }

  @Post()
  create(
    @Req() req: Request & { user: { userID: number } },
    @Body() payload: Partial<RosterPerson>,
  ) {
    return this.rosterService.create(req.user.userID, payload);
  }

  @Put(':id')
  update(
    @Req() req: Request & { user: { userID: number } },
    @Param('id') id: string,
    @Body() payload: Partial<RosterPerson>,
  ) {
    return this.rosterService.update(req.user.userID, id, payload);
  }

  @Delete(':id')
  remove(
    @Req() req: Request & { user: { userID: number } },
    @Param('id') id: string,
  ) {
    return this.rosterService.remove(req.user.userID, id);
  }
}
