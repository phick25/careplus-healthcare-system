import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { AuthRole } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { getJwtSecret } from './jwt-secret';
import type { AuthenticatedUser } from './auth.types';

interface JwtPayload {
  sub?: unknown;
  role?: unknown;
  hospitalId?: unknown;
}

function isAuthRole(value: unknown): value is AuthRole {
  return Object.values(AuthRole).some((role) => role === value);
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(),
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    if (
      typeof payload.sub !== 'string'
      || !isAuthRole(payload.role)
      || (payload.hospitalId !== null && typeof payload.hospitalId !== 'string')
    ) {
      throw new UnauthorizedException('Invalid access token');
    }

    return {
      sub: payload.sub,
      role: payload.role,
      hospitalId: payload.hospitalId,
    };
  }
}
