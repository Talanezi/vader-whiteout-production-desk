import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('PD_JWT_SECRET') || 'dev-production-desk-secret',
    });
  }

  async validate(payload: { sub: number; email: string; name: string }) {
    return {
      userID: payload.sub,
      email: payload.email,
      name: payload.name,
    };
  }
}
