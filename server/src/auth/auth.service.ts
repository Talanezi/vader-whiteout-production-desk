import { Injectable, InternalServerErrorException, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

type SchedulerLoginResponse = {
  userID?: number;
  email?: string;
  name?: string;
  token?: string;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly jwtService: JwtService) {}

  private getSchedulerApiBaseUrl() {
    return (
      process.env.SCHEDULER_API_BASE_URL ||
      'https://api-scheduler.vaderwhiteout.com'
    ).replace(/\/$/, '');
  }

  async login(email: string, password: string) {
    const url = `${this.getSchedulerApiBaseUrl()}/api/login`;
    this.logger.log(`Proxy login request to ${url} for email="${email.trim()}"`);

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
    } catch (error) {
      this.logger.error(`Scheduler login fetch failed`, error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException('Scheduler auth request failed');
    }

    const rawText = await response.text();
    this.logger.log(`Scheduler login response status=${response.status} body=${rawText.slice(0, 500)}`);

    if (!response.ok) {
      throw new UnauthorizedException('Invalid email or password');
    }

    let schedulerUser: SchedulerLoginResponse;
    try {
      schedulerUser = JSON.parse(rawText) as SchedulerLoginResponse;
    } catch {
      throw new InternalServerErrorException('Scheduler auth returned non-JSON response');
    }

    if (!schedulerUser.userID || !schedulerUser.email || !schedulerUser.name) {
      throw new InternalServerErrorException('Scheduler auth returned unexpected response shape');
    }

    const token = await this.jwtService.signAsync({
      sub: schedulerUser.userID,
      email: schedulerUser.email,
      name: schedulerUser.name,
    });

    return {
      token,
      user: {
        id: schedulerUser.userID,
        email: schedulerUser.email,
        name: schedulerUser.name,
      },
    };
  }

  async me(user: { userID: number; email: string; name: string }) {
    return {
      id: user.userID,
      email: user.email,
      name: user.name,
    };
  }
}
