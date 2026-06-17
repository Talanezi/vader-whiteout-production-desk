import { Body, Controller, Delete, Get, Param, Post, Put, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { SchedulerAuthGuard } from '../auth/scheduler-auth.guard';
import { MailService } from '../mail/mail.service';
import { CallsheetsService } from './callsheets.service';
import { CallSheetDraft } from './callsheet.types';
import { buildCallSheetEmailHtml, buildCallSheetEmailText } from './email/build-callsheet-email';
import { buildCallSheetLatex } from './pdf/build-callsheet-latex';
import { compileLatexToPdf } from './pdf/compile-latex-to-pdf';

@UseGuards(SchedulerAuthGuard)
@Controller('api/callsheets')
export class CallsheetsController {
  constructor(
    private readonly callsheetsService: CallsheetsService,
    private readonly mailService: MailService,
  ) {}

  @Get()
  list(@Req() req: Request & { user: { userID: number } }) {
    return this.callsheetsService.list(req.user.userID);
  }

  @Get('email/config')
  getEmailConfig() {
    return this.mailService.getStatus();
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

  @Post(':id/email/test')
  async sendTestEmail(
    @Req() req: Request & { user: { userID: number } },
    @Param('id') id: string,
    @Body() payload: { testRecipientEmail?: string },
  ) {
    const draft = await this.callsheetsService.getById(req.user.userID, id);
    const recipient = payload.testRecipientEmail?.trim();
    if (!recipient) {
      return { ok: false, message: 'Test recipient email is required.' };
    }

    return this.mailService.send({
      to: [{ email: recipient, name: 'Test Recipient' }],
      subject: `[TEST] ${draft.emailSubject || draft.title || 'Vader: Whiteout Call Sheet'}`,
      html: buildCallSheetEmailHtml(draft),
      text: buildCallSheetEmailText(draft),
      replyTo: draft.emailReplyTo,
    });
  }

  @Post(':id/email/send')
  async sendEmail(
    @Req() req: Request & { user: { userID: number } },
    @Param('id') id: string,
  ) {
    const draft = await this.callsheetsService.getById(req.user.userID, id);
    const recipients = draft.distributionRecipients
      .filter((recipient) => recipient.included && recipient.email.trim())
      .map((recipient) => ({
        email: recipient.email,
        name: recipient.name,
      }));

    const result = await this.mailService.send({
      to: recipients,
      subject: draft.emailSubject || draft.title || 'Vader: Whiteout Call Sheet',
      html: buildCallSheetEmailHtml(draft),
      text: buildCallSheetEmailText(draft),
      replyTo: draft.emailReplyTo,
    });

    const updated = await this.callsheetsService.update(req.user.userID, id, {
      distributionStatus: draft.status === 'revised' ? 'revision_distributed' : 'distributed',
      distributionRecipients: draft.distributionRecipients.map((recipient) =>
        recipient.included && recipient.email.trim() && recipient.confirmationStatus !== 'confirmed'
          ? { ...recipient, confirmationStatus: 'sent' }
          : recipient,
      ),
    });

    return {
      ...result,
      draft: updated,
    };
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
