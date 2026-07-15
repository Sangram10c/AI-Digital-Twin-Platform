import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RefreshToken, User } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { IDENTITY_CONSTANTS } from '../constants/identity.constants';
import {
  addDurationToDate,
  generateSecureToken,
  hashToken,
} from '../utils/crypto.util';
import { TokenService } from './token.service';

@Injectable()
export class RefreshTokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) {}

  async issueForSession(
    userId: string,
    sessionId: string,
  ): Promise<{ token: string; record: RefreshToken }> {
    await this.revokeActiveTokensForSession(sessionId);

    const plainToken = generateSecureToken(
      IDENTITY_CONSTANTS.REFRESH_TOKEN_BYTES,
    );
    const expiresAt = addDurationToDate(
      this.tokenService.getRefreshExpiration(),
    );

    const record = await this.prisma.refreshToken.create({
      data: {
        userId,
        sessionId,
        tokenHash: hashToken(plainToken),
        expiresAt,
      },
    });

    return { token: plainToken, record };
  }

  async rotate(
    plainRefreshToken: string,
    user: User,
    sessionId: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenHash = hashToken(plainRefreshToken);
    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!existing) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (existing.userId !== user.id || existing.sessionId !== sessionId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (existing.revokedAt) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (existing.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    if (existing.replacedByTokenId) {
      await this.handleReuseDetection(user.id);
      throw new ForbiddenException('Refresh token reuse detected');
    }

    const newPlain = generateSecureToken(
      IDENTITY_CONSTANTS.REFRESH_TOKEN_BYTES,
    );
    const expiresAt = addDurationToDate(
      this.tokenService.getRefreshExpiration(),
    );

    await this.prisma.$transaction(async (tx) => {
      const created = await tx.refreshToken.create({
        data: {
          userId: user.id,
          sessionId,
          tokenHash: hashToken(newPlain),
          expiresAt,
        },
      });

      await tx.refreshToken.update({
        where: { id: existing.id },
        data: {
          revokedAt: new Date(),
          replacedByTokenId: created.id,
        },
      });
    });

    const accessToken = this.tokenService.signAccessToken(user, sessionId);

    return {
      accessToken,
      refreshToken: newPlain,
    };
  }

  async revokeByPlainToken(plainRefreshToken: string): Promise<void> {
    const tokenHash = hashToken(plainRefreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async revokeActiveTokensForSession(sessionId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async handleReuseDetection(userId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      this.prisma.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }
}
