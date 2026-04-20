import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';

type SchedulerJwtPayload = {
  sub?: number;
  email?: string;
  name?: string;
  iat?: number;
  exp?: number;
};

type SchedulerUserRow = {
  ID: number;
  Email: string;
  Name: string;
};

@Injectable()
export class AuthService {
  private cachedSigningKey: string | null = null;

  constructor(
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
  ) {}

  private async getSchedulerJwtSigningKey() {
    if (this.cachedSigningKey) {
      return this.cachedSigningKey;
    }

    if (process.env.SCHEDULER_JWT_SIGNING_KEY) {
      this.cachedSigningKey = process.env.SCHEDULER_JWT_SIGNING_KEY;
      return this.cachedSigningKey;
    }

    const rows = await this.dataSource.query(
      'SELECT "Value" FROM "Config" WHERE "Key" = $1 LIMIT 1',
      ['JWT_SIGNING_KEY'],
    );

    const key = rows?.[0]?.Value;
    if (!key || typeof key !== 'string') {
      throw new UnauthorizedException('Scheduler JWT signing key not found');
    }

    this.cachedSigningKey = key;
    return key;
  }

  private async findUserByID(userID: number): Promise<SchedulerUserRow | null> {
    const rows = await this.dataSource.query(
      'SELECT "ID", "Email", "Name" FROM "User" WHERE "ID" = $1 LIMIT 1',
      [userID],
    );
    return rows?.[0] ?? null;
  }

  async verifySchedulerToken(token: string) {
    const signingKey = await this.getSchedulerJwtSigningKey();

    let payload: SchedulerJwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<SchedulerJwtPayload>(token, {
        secret: signingKey,
      });
    } catch {
      throw new UnauthorizedException('Invalid scheduler session');
    }

    if (!payload?.sub || typeof payload.sub !== 'number') {
      throw new UnauthorizedException('Invalid scheduler session');
    }

    const user = await this.findUserByID(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      userID: user.ID,
      email: user.Email,
      name: user.Name,
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
