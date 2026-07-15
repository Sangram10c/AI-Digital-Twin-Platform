import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Session } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { IDENTITY_CONSTANTS } from '../constants/identity.constants';
import {
  addDurationToDate,
  generateSecureToken,
  hashToken,
} from '../utils/crypto.util';
import { TokenService } from './token.service';

export interface CreateSessionInput {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) {}

  async createSession(input: CreateSessionInput): Promise<Session> {
    const sessionToken = generateSecureToken(
      IDENTITY_CONSTANTS.SESSION_TOKEN_BYTES,
    );
    const expiresAt = addDurationToDate(
      this.tokenService.getRefreshExpiration(),
    );

    return this.prisma.session.create({
      data: {
        userId: input.userId,
        tokenHash: hashToken(sessionToken),
        expiresAt,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        lastActivityAt: new Date(),
      },
    });
  }

  async touchSession(sessionId: string): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { lastActivityAt: new Date() },
    });
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async assertSessionActive(sessionId: string): Promise<Session> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session is not active');
    }

    return session;
  }
}
