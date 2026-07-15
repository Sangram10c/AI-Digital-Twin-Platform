import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { EMAIL_SERVICE } from './interfaces/email-service.interface';
import { IdentityService } from './identity.service';
import { PasswordService } from './services/password.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { SessionService } from './services/session.service';
import { TokenService } from './services/token.service';

describe('IdentityService', () => {
  let service: IdentityService;

  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const passwordService = {
    hash: jest.fn(),
    verify: jest.fn(),
  };

  const sessionService = {
    createSession: jest.fn(),
    touchSession: jest.fn(),
    revokeSession: jest.fn(),
  };

  const refreshTokenService = {
    issueForSession: jest.fn(),
    rotate: jest.fn(),
    revokeByPlainToken: jest.fn(),
  };

  const tokenService = {
    signAccessToken: jest.fn(),
    buildAuthTokensResponse: jest.fn(),
    signEmailVerificationToken: jest.fn(),
    signPasswordResetToken: jest.fn(),
    verifyPasswordResetToken: jest.fn(),
    verifyEmailVerificationToken: jest.fn(),
    getRefreshExpiration: jest.fn(),
  };

  const emailService = {
    sendWelcomeEmail: jest.fn(),
    sendVerificationEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdentityService,
        { provide: PrismaService, useValue: prisma },
        { provide: PasswordService, useValue: passwordService },
        { provide: SessionService, useValue: sessionService },
        { provide: RefreshTokenService, useValue: refreshTokenService },
        { provide: TokenService, useValue: tokenService },
        { provide: EMAIL_SERVICE, useValue: emailService },
      ],
    }).compile();

    service = module.get(IdentityService);
  });

  it('registers a new user', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    passwordService.hash.mockResolvedValue('hashed');
    prisma.user.create.mockResolvedValue({
      id: 'user-1',
      email: 'jane@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
      displayName: 'Jane Doe',
      role: 'USER',
      status: UserStatus.PENDING_VERIFICATION,
      emailVerifiedAt: null,
    });
    sessionService.createSession.mockResolvedValue({ id: 'session-1' });
    tokenService.signAccessToken.mockReturnValue('access');
    refreshTokenService.issueForSession.mockResolvedValue({
      token: 'refresh',
    });
    tokenService.buildAuthTokensResponse.mockReturnValue({
      accessToken: 'access',
      refreshToken: 'refresh',
      tokenType: 'Bearer',
      expiresIn: '15m',
    });
    tokenService.signEmailVerificationToken.mockReturnValue('verify-token');

    const result = await service.register(
      {
        email: 'jane@example.com',
        password: 'Str0ng!Pass',
        firstName: 'Jane',
        lastName: 'Doe',
      },
      {},
    );

    expect(result.tokens.accessToken).toBe('access');
    expect(emailService.sendWelcomeEmail).toHaveBeenCalled();
    expect(emailService.sendVerificationEmail).toHaveBeenCalled();
  });

  it('rejects duplicate email registration', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'existing',
      deletedAt: null,
    });

    await expect(
      service.register(
        { email: 'jane@example.com', password: 'Str0ng!Pass' },
        {},
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects invalid login credentials', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'jane@example.com',
      passwordHash: 'hash',
      status: UserStatus.ACTIVE,
      deletedAt: null,
    });
    passwordService.verify.mockResolvedValue(false);

    await expect(
      service.login({ email: 'jane@example.com', password: 'wrong' }, {}),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
