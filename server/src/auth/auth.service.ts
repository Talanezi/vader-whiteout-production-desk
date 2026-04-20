import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { UserEntity } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersRepo.findOne({
      where: { Email: email.trim().toLowerCase() },
    });

    if (!user || !user.PasswordHash) {
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
    const user = await this.usersRepo.findOne({ where: { ID: userID } });
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
