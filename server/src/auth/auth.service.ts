import {
  Injectable,
  UnauthorizedException,
  ServiceUnavailableException,
} from '@nestjs/common';

type SchedulerMeResponse = {
  userID?: number;
  ID?: number;
  id?: number;
  Email?: string;
  email?: string;
  Name?: string;
  name?: string;
  department?: unknown;
  role?: unknown;
  productionMembership?: unknown;
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
    let response: Response;
    try {
      response = await fetch(`${this.getSchedulerApiBaseUrl()}/api/me`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10000),
      });
    } catch {
      throw new ServiceUnavailableException(
        'Authentication service is temporarily unavailable. Try again.',
      );
    }
    if (response.status === 401 || response.status === 403)
      throw new UnauthorizedException('Invalid scheduler session');
    if (!response.ok)
      throw new ServiceUnavailableException(
        'Authentication service is temporarily unavailable. Try again.',
      );
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
      department: user.department,
      role: user.role,
      productionMembership: user.productionMembership,
    };
  }

  async logout(token: string) {
    if (!token)
      throw new UnauthorizedException('Invalid scheduler session');
    const response = await fetch(
      `${this.getSchedulerApiBaseUrl()}/api/logout?everywhere=false`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!response.ok)
      throw new ServiceUnavailableException(
        'Scheduler could not confirm sign out. Please retry.',
      );
    return { ok: true };
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
