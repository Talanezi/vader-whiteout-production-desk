import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SchedulerAuthGuard } from '../auth/scheduler-auth.guard';
import { Collaborator, ShotlistsService } from './shotlists.service';

@UseGuards(SchedulerAuthGuard)
@Controller('api/shotlists')
export class ShotlistsController {
  constructor(private readonly lists: ShotlistsService) {}
  @Get() list(@Req() req: { user: Collaborator }) {
    return this.lists.list(req.user);
  }
  @Post() create(
    @Req() req: { user: Collaborator },
    @Body() payload: { name?: unknown },
  ) {
    return this.lists.create(req.user, payload?.name);
  }
  @Get(':id/session') session(
    @Req() req: { user: Collaborator },
    @Param('id') id: string,
  ) {
    return this.lists.session(id, req.user);
  }
  @Get(':id/export') export(
    @Req() req: { user: Collaborator },
    @Param('id') id: string,
  ) {
    return this.lists.export(id, req.user);
  }
  @Post(':id/import') import(
    @Req() req: { user: Collaborator },
    @Param('id') id: string,
    @Body() payload: { batchId?: string; scenes?: unknown[] },
  ) {
    return this.lists.import(id, req.user, payload);
  }
}
