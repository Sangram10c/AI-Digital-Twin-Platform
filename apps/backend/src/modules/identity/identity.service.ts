import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { User, UserStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  AuthResponse,
  AuthenticatedUserResponse,
} from './interfaces/auth-response.interface';
import type { IEmailService } from './interfaces/email-service.interface';
import { EMAIL_SERVICE } from './interfaces/email-service.interface';
import { PasswordService } from './services/password.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { SessionService } from './services/session.service';
import { TokenService } from './services/token.service';
import { hashToken } from './utils/crypto.util';

export interface RequestContext {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class IdentityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly sessionService: SessionService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly tokenService: TokenService,
    @Inject(EMAIL_SERVICE) private readonly emailService: IEmailService,
  ) {}

  async register(
    input: {
      email: string;
      password: string;
      firstName?: string;
      lastName?: string;
      displayName?: string;
    },
    context: RequestContext,
  ): Promise<AuthResponse> {
    const normalizedEmail = input.email.trim().toLowerCase();

    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing && !existing.deletedAt) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await this.passwordService.hash(input.password);

    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        displayName:
          input.displayName ??
          ([input.firstName, input.lastName].filter(Boolean).join(' ') || null),
        status: UserStatus.PENDING_VERIFICATION,
      },
    });

    await this.emailService.sendWelcomeEmail(
      user.email,
      user.displayName ?? user.email,
    );
    const verificationToken = await this.sendVerificationEmail(user);

    const authResponse = await this.createAuthResponse(user, context);

    if (process.env.NODE_ENV !== 'production') {
      authResponse.devToken = verificationToken;
    }

    return authResponse;
  }

  async login(
    input: { email: string; password: string },
    context: RequestContext,
  ): Promise<AuthResponse> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    this.assertUserCanAuthenticate(user);

    if (!user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await this.passwordService.verify(
      input.password,
      user.passwordHash,
    );

    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.createAuthResponse(user, context);
  }

  async logout(
    user: User,
    sessionId: string,
    refreshToken?: string,
  ): Promise<void> {
    await this.sessionService.revokeSession(sessionId);

    if (refreshToken) {
      await this.refreshTokenService.revokeByPlainToken(refreshToken);
    } else {
      await this.refreshTokenService.revokeAllForUser(user.id);
    }
  }

  async refresh(
    plainRefreshToken: string,
    _context: RequestContext,
  ): Promise<AuthResponse['tokens']> {
    const tokenHash = hashToken(plainRefreshToken);

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored?.sessionId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = stored.user;
    this.assertUserCanAuthenticate(user);

    const rotated = await this.refreshTokenService.rotate(
      plainRefreshToken,
      user,
      stored.sessionId,
    );

    await this.sessionService.touchSession(stored.sessionId);

    return this.tokenService.buildAuthTokensResponse(
      rotated.accessToken,
      rotated.refreshToken,
    );
  }

  async forgotPassword(
    email: string,
  ): Promise<{ message: string; devToken?: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    let devToken: string | undefined;

    if (user && !user.deletedAt && user.status !== UserStatus.DELETED) {
      const token = this.tokenService.signPasswordResetToken(
        user.id,
        user.email,
      );
      await this.emailService.sendPasswordResetEmail(user.email, token);
      if (process.env.NODE_ENV !== 'production') {
        devToken = token;
      }
    }

    return {
      message:
        'If an account exists for that email, password reset instructions have been sent.',
      ...(devToken ? { devToken } : {}),
    };
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    let payload;
    try {
      payload = this.tokenService.verifyPasswordResetToken(token);
    } catch {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    this.assertUserCanAuthenticate(user);

    const passwordHash = await this.passwordService.hash(newPassword);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      this.prisma.session.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { message: 'Password has been reset successfully' };
  }

  async changePassword(
    user: User,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    if (!user.passwordHash) {
      throw new BadRequestException(
        'Password authentication is not configured',
      );
    }

    const valid = await this.passwordService.verify(
      currentPassword,
      user.passwordHash,
    );

    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await this.passwordService.hash(newPassword);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return { message: 'Password changed successfully' };
  }

  async resendVerification(
    email: string,
  ): Promise<{ message: string; devToken?: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    let devToken: string | undefined;

    if (user && !user.deletedAt && !user.emailVerifiedAt) {
      devToken = await this.sendVerificationEmail(user);
      if (process.env.NODE_ENV === 'production') {
        devToken = undefined;
      }
    }

    return {
      message:
        'If an unverified account exists for that email, a verification message has been sent.',
      ...(devToken ? { devToken } : {}),
    };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    let payload;
    try {
      payload = this.tokenService.verifyEmailVerificationToken(token);
    } catch {
      throw new BadRequestException('Invalid or expired verification token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || user.deletedAt) {
      throw new BadRequestException('Invalid verification token');
    }

    if (user.email !== payload.email) {
      throw new BadRequestException('Invalid verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: new Date(),
        status:
          user.status === UserStatus.PENDING_VERIFICATION
            ? UserStatus.ACTIVE
            : user.status,
      },
    });

    return { message: 'Email verified successfully' };
  }

  toAuthenticatedUser(user: User): AuthenticatedUserResponse {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName,
      role: user.role,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt,
    };
  }

  private async createAuthResponse(
    user: User,
    context: RequestContext,
  ): Promise<AuthResponse> {
    const session = await this.sessionService.createSession({
      userId: user.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    const accessToken = this.tokenService.signAccessToken(user, session.id);
    const refresh = await this.refreshTokenService.issueForSession(
      user.id,
      session.id,
    );

    return {
      user: this.toAuthenticatedUser(user),
      tokens: this.tokenService.buildAuthTokensResponse(
        accessToken,
        refresh.token,
      ),
    };
  }

  private async sendVerificationEmail(user: User): Promise<string> {
    const token = this.tokenService.signEmailVerificationToken(
      user.id,
      user.email,
    );
    await this.emailService.sendVerificationEmail(user.email, token);
    return token;
  }

  private assertUserCanAuthenticate(user: User | null): asserts user is User {
    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === UserStatus.DELETED) {
      throw new UnauthorizedException('Account has been deleted');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('Account is suspended');
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new ForbiddenException('Account is inactive');
    }
  }
}
