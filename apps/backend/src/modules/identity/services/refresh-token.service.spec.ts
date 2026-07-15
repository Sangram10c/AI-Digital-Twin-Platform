import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { RefreshTokenService } from './refresh-token.service';
import { TokenService } from './token.service';

describe('RefreshTokenService', () => {
  const prisma = {
    refreshToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    session: {
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const tokenService = {
    signAccessToken: jest.fn(),
    getRefreshExpiration: jest.fn().mockReturnValue('7d'),
  };

  let service: RefreshTokenService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RefreshTokenService(
      prisma as never,
      tokenService as unknown as TokenService,
    );
  });

  it('rejects rotation when token was already replaced (reuse detection)', async () => {
    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 'rt-1',
      userId: 'user-1',
      sessionId: 'session-1',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      replacedByTokenId: 'rt-2',
    });
    prisma.$transaction.mockResolvedValue([]);

    await expect(
      service.rotate('plain-token', { id: 'user-1' } as never, 'session-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects expired refresh tokens', async () => {
    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 'rt-1',
      userId: 'user-1',
      sessionId: 'session-1',
      revokedAt: null,
      expiresAt: new Date(Date.now() - 60_000),
      replacedByTokenId: null,
    });

    await expect(
      service.rotate('plain-token', { id: 'user-1' } as never, 'session-1'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
