import { Injectable } from '@nestjs/common';
import { OAuthToken, ProviderType } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { OAuthTokenEncryptionService } from './oauth-token-encryption.service';

@Injectable()
export class OAuthTokenStorageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: OAuthTokenEncryptionService,
  ) {}

  async findGithubTokensForUser(userId: string): Promise<OAuthToken[]> {
    return this.prisma.oAuthToken.findMany({
      where: {
        userId,
        provider: ProviderType.GITHUB,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findGithubTokenById(
    userId: string,
    oauthTokenId: string,
  ): Promise<OAuthToken | null> {
    return this.prisma.oAuthToken.findFirst({
      where: {
        id: oauthTokenId,
        userId,
        provider: ProviderType.GITHUB,
      },
    });
  }

  decryptAccessToken(token: OAuthToken): string {
    return this.encryptionService.decrypt(token.accessTokenEncrypted);
  }

  decryptRefreshToken(token: OAuthToken): string | null {
    if (!token.refreshTokenEncrypted) {
      return null;
    }
    return this.encryptionService.decrypt(token.refreshTokenEncrypted);
  }

  isAccessTokenExpired(token: OAuthToken): boolean {
    if (!token.accessTokenExpiresAt) {
      return false;
    }
    return token.accessTokenExpiresAt.getTime() <= Date.now();
  }

  /**
   * Placeholder for future refresh-token rotation against GitHub.
   * GitHub OAuth Apps typically issue non-expiring tokens unless revoked.
   */
  refreshGithubTokenIfNeeded(_token: OAuthToken): Promise<OAuthToken> {
    return Promise.reject(
      new Error('GitHub token refresh is not implemented yet'),
    );
  }
}
