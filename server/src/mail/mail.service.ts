import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type MailRecipient = {
  email: string;
  name?: string;
};

type SendMailInput = {
  to: MailRecipient[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

@Injectable()
export class MailService {
  constructor(private readonly configService: ConfigService) {}

  getStatus() {
    const apiKey = this.configService.get<string>('MAILERSEND_API_KEY');
    const fromEmail = this.configService.get<string>('MAIL_FROM_EMAIL');
    const fromName = this.configService.get<string>('MAIL_FROM_NAME') || 'Vader: Whiteout Production Desk';

    return {
      configured: Boolean(apiKey && fromEmail),
      provider: apiKey && fromEmail ? 'mailersend' : null,
      fromEmail: fromEmail || '',
      fromName,
    };
  }

  async send(input: SendMailInput) {
    const apiKey = this.configService.get<string>('MAILERSEND_API_KEY');
    const fromEmail = this.configService.get<string>('MAIL_FROM_EMAIL');
    const fromName = this.configService.get<string>('MAIL_FROM_NAME') || 'Vader: Whiteout Production Desk';

    if (!apiKey || !fromEmail) {
      throw new BadRequestException('Email sending is not configured yet.');
    }

    const recipients = input.to.filter((recipient) => recipient.email.trim());
    if (recipients.length === 0) {
      throw new BadRequestException('No email recipients were selected.');
    }

    const response = await fetch('https://api.mailersend.com/v1/email', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: {
          email: fromEmail,
          name: fromName,
        },
        to: recipients.map((recipient) => ({
          email: recipient.email,
          name: recipient.name || recipient.email,
        })),
        reply_to: input.replyTo ? { email: input.replyTo } : undefined,
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new BadRequestException(text || 'Mail provider rejected the send request.');
    }

    return {
      ok: true,
      sent: recipients.length,
    };
  }
}
