import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

type RawUserRow = {
  ID: number;
  Email: string;
  Name: string;
  PasswordHash: string | null;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
  ) {}

  private async findUserByEmail(email: string): Promise<RawUserRow | null> {
    const rows = await this.dataSource.query(
      'SELECT "ID", "Email", "Name", "PasswordHash" FROM "User" WHERE "Email" = $1 LIMIT 1',
      [email.trim()],
    );
    return rows[0] ?? null;
  }

  private async findUserByID(userID: number): Promise<RawUserRow | null> {
    const rows = await this.dataSource.query(
      'SELECT "ID", "Email", "Name", "PasswordHash" FROM "User" WHERE "ID" = $1 LIMIT 1',
      [userID],
    );
    return rows[0] ?? null;
  }

  async validateUser(email: string, password: string) {
    const user = await this.findUserByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.PasswordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const ok = await bcrypt.compare(password, user.PasswordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);

    const token = await this.jwtService.signAsync({
      sub: user.ID,
      email: user.Email,
      name: user.Name,
    });

    return {
      token,
      user: {
        id: user.ID,
        email: user.Email,
        name: user.Name,
      },
    };
  }

  async me(userID: number) {
    const user = await this.findUserByID(userID);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.ID,
      email: user.Email,
      name: user.Name,
    };
  }
}
