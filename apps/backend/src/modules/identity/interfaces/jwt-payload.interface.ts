import { UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  sessionId: string;
  type: 'access';
}

export interface EmailVerificationPayload {
  sub: string;
  email: string;
  type: 'email_verify';
}

export interface PasswordResetPayload {
  sub: string;
  email: string;
  type: 'password_reset';
}
