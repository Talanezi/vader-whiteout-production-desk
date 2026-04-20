import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';

@Injectable()
export class SchedulerAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<
      Request & { user?: { userID: number; email: string; name: string } }
    >();

    const header = request.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing scheduler session');
    }

    const token = header.slice('Bearer '.length).trim();
    if (!token) {
      throw new UnauthorizedException('Missing scheduler session');
    }

    request.user = await this.authService.verifySchedulerToken(token);
    return true;
  }
}
