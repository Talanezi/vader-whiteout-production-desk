import { Body, Controller, Delete, Get, Param, Post, Put, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { SchedulerAuthGuard } from '../auth/scheduler-auth.guard';
import { CallsheetsService } from './callsheets.service';
import { CallSheetDraft } from './callsheet.types';
import { buildCallSheetLatex } from './pdf/build-callsheet-latex';
import { compileLatexToPdf } from './pdf/compile-latex-to-pdf';

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

  @Get(':id/pdf')
  async downloadPdf(
    @Req() req: Request & { user: { userID: number } },
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const draft = await this.callsheetsService.getById(req.user.userID, id);
    const tex = buildCallSheetLatex(draft);
    const pdf = await compileLatexToPdf(tex);

    const safeName = (draft.title || 'callsheet').replace(/[^a-z0-9-_]+/gi, '-').toLowerCase();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.pdf"`);
    res.send(pdf);
  }

  @Post()
  create(
    @Req() req: Request & { user: { userID: number } },
    @Body() payload: Partial<CallSheetDraft>,
  ) {
    return this.callsheetsService.create(req.user.userID, payload);
  }

  @Post(':id/duplicate')
  duplicate(
    @Req() req: Request & { user: { userID: number } },
    @Param('id') id: string,
  ) {
    return this.callsheetsService.duplicate(req.user.userID, id);
  }

  @Put(':id')
  update(
    @Req() req: Request & { user: { userID: number } },
    @Param('id') id: string,
    @Body() payload: Partial<CallSheetDraft>,
  ) {
    return this.callsheetsService.update(req.user.userID, id, payload);
  }

  @Delete(':id')
  remove(
    @Req() req: Request & { user: { userID: number } },
    @Param('id') id: string,
  ) {
    return this.callsheetsService.remove(req.user.userID, id);
  }
}
