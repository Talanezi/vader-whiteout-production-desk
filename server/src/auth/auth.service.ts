import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

type SchedulerLoginResponse = {
  userID: number;
  email: string;
  name: string;
  token: string;
};

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  private getSchedulerApiBaseUrl() {
    return (
      process.env.SCHEDULER_API_BASE_URL ||
      'https://api-scheduler.vaderwhiteout.com'
    ).replace(/\/$/, '');
  }

  async login(email: string, password: string) {
    const response = await fetch(`${this.getSchedulerApiBaseUrl()}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
    });

    if (!response.ok) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const schedulerUser =
      (await response.json()) as SchedulerLoginResponse;

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
