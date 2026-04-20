import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { SchedulerAuthGuard } from './scheduler-auth.guard';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(SchedulerAuthGuard)
  @Get('me')
  me(
    @Req()
    req: Request & {
      headers: { authorization?: string };
      user?: { userID: number; email: string; name: string };
    },
  ) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    return this.authService.meFromToken(token);
  }
}
