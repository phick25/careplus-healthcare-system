import type { AuthRole } from '@prisma/client';

export interface AuthenticatedUser {
  sub: string;
  role: AuthRole;
  hospitalId: string | null;
}

export interface AuthTokenResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: AuthenticatedUser;
}
