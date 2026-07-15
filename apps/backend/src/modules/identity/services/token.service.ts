import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { IDENTITY_CONSTANTS } from '../constants/identity.constants';
import { AuthTokensResponse } from '../interfaces/auth-response.interface';
import {
  EmailVerificationPayload,
  JwtPayload,
  PasswordResetPayload,
} from '../interfaces/jwt-payload.interface';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  signAccessToken(user: User, sessionId: string): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      sessionId,
      type: IDENTITY_CONSTANTS.ACCESS_TOKEN_TYPE,
    };

    return this.jwtService.sign(payload, {
      expiresIn: this.configService.getOrThrow<string>(
        'jwt.accessExpiration',
      ) as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });
  }

  buildAuthTokensResponse(
    accessToken: string,
    refreshToken: string,
  ): AuthTokensResponse {
    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.configService.getOrThrow<string>('jwt.accessExpiration'),
    };
  }

  signEmailVerificationToken(userId: string, email: string): string {
    const payload: EmailVerificationPayload = {
      sub: userId,
      email,
      type: IDENTITY_CONSTANTS.EMAIL_VERIFY_TOKEN_TYPE,
    };

    return this.jwtService.sign(payload, {
      expiresIn:
        IDENTITY_CONSTANTS.EMAIL_VERIFY_EXPIRY as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });
  }

  signPasswordResetToken(userId: string, email: string): string {
    const payload: PasswordResetPayload = {
      sub: userId,
      email,
      type: IDENTITY_CONSTANTS.PASSWORD_RESET_TOKEN_TYPE,
    };

    return this.jwtService.sign(payload, {
      expiresIn:
        IDENTITY_CONSTANTS.PASSWORD_RESET_EXPIRY as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });
  }

  verifyEmailVerificationToken(token: string): EmailVerificationPayload {
    const payload = this.jwtService.verify<EmailVerificationPayload>(token);
    if (payload.type !== IDENTITY_CONSTANTS.EMAIL_VERIFY_TOKEN_TYPE) {
      throw new Error('Invalid email verification token type');
    }
    return payload;
  }

  verifyPasswordResetToken(token: string): PasswordResetPayload {
    const payload = this.jwtService.verify<PasswordResetPayload>(token);
    if (payload.type !== IDENTITY_CONSTANTS.PASSWORD_RESET_TOKEN_TYPE) {
      throw new Error('Invalid password reset token type');
    }
    return payload;
  }

  getRefreshExpiration(): string {
    return this.configService.getOrThrow<string>('jwt.refreshExpiration');
  }
}
