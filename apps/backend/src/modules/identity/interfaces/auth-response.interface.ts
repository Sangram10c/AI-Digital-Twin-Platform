import { JwtPayload } from '../interfaces/jwt-payload.interface';

export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
}

export interface AuthenticatedUserResponse {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  role: string;
  status: string;
  emailVerifiedAt: Date | null;
}

export interface AuthResponse {
  user: AuthenticatedUserResponse;
  tokens: AuthTokensResponse;
  /** Development only — email verification token for Swagger testing */
  devToken?: string;
}

export type AccessJwtPayload = JwtPayload;
