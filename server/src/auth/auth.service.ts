import { Injectable, UnauthorizedException } from '@nestjs/common';

type SchedulerMeResponse = {
  userID?: number;
  ID?: number;
  id?: number;
  Email?: string;
  email?: string;
  Name?: string;
  name?: string;
};

@Injectable()
export class AuthService {
  private getSchedulerApiBaseUrl() {
    return (
      process.env.SCHEDULER_API_BASE_URL ||
      'https://vader-whiteout-scheduler-production.up.railway.app'
    ).replace(/\/$/, '');
  }

  async verifySchedulerToken(token: string) {
    const response = await fetch(`${this.getSchedulerApiBaseUrl()}/api/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new UnauthorizedException('Invalid scheduler session');
    }

    const user = (await response.json()) as SchedulerMeResponse;

    const userID = user.userID ?? user.id ?? user.ID;
    const email = user.email ?? user.Email;
    const name = user.name ?? user.Name;

    if (!userID || !email || !name) {
      throw new UnauthorizedException('Invalid scheduler session');
    }

    return {
      userID: Number(userID),
      email,
      name,
    };
  }

  async meFromToken(token: string) {
    const user = await this.verifySchedulerToken(token);
    return {
      id: user.userID,
      email: user.email,
      name: user.name,
    };
  }
}
