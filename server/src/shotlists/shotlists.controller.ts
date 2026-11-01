import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import type { TablePrintSpec } from './pdf/table-print';
import type { PrintOptions } from './pdf/shotlist-report';
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
    @Body() payload: { name?: unknown; firstDate?: unknown },
  ) {
    return this.lists.create(req.user, payload?.name, payload?.firstDate);
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
  @Post(':id/manage') manage(
    @Req() req: { user: Collaborator },
    @Param('id') id: string,
    @Body() payload: { action?: string; name?: string },
  ) {
    return this.lists.manage(id, req.user, payload);
  }
  @Post(':id/pdf') async pdf(
    @Req() req: { user: Collaborator },
    @Param('id') id: string,
    @Body() options: PrintOptions | TablePrintSpec,
  ) {
    return new StreamableFile(
      await this.lists.pdf(id, req.user, options || {}),
      {
        type: 'application/pdf',
        disposition: 'attachment; filename="whiteout-shot-list.pdf"',
      },
    );
  }
  @Post(':id/import') import(
    @Req() req: { user: Collaborator },
    @Param('id') id: string,
    @Body()
    payload: { batchId?: string; scenes?: unknown[]; schedule?: unknown },
  ) {
    return this.lists.import(id, req.user, payload);
  }
}
