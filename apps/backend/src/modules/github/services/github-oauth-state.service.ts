import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { generateSecureToken } from '../../identity/utils/crypto.util';
import { OAuthStatePayload } from '../interfaces/oauth-state-payload.interface';

@Injectable()
export class GithubOAuthStateService {
  constructor(private readonly configService: ConfigService) {}

  createState(userId: string, workspaceId?: string): string {
    const ttlSeconds = this.configService.get<number>(
      'oauth.github.stateTtlSeconds',
    )!;

    const payload: OAuthStatePayload = {
      userId,
      ...(workspaceId ? { workspaceId } : {}),
      nonce: generateSecureToken(16),
      exp: Math.floor(Date.now() / 1000) + ttlSeconds,
    };

    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
      'base64url',
    );
    const signature = this.sign(encodedPayload);

    return `${encodedPayload}.${signature}`;
  }

  verifyState(state: string): OAuthStatePayload {
    const [encodedPayload, signature] = state.split('.');
    if (!encodedPayload || !signature) {
      throw new Error('Invalid OAuth state format');
    }

    const expectedSignature = this.sign(encodedPayload);
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      throw new Error('Invalid OAuth state signature');
    }

    const payload = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8'),
    ) as OAuthStatePayload;

    if (!payload.userId || !payload.exp) {
      throw new Error('Invalid OAuth state payload');
    }

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('OAuth state has expired');
    }

    return payload;
  }

  private sign(encodedPayload: string): string {
    const secret = this.getStateSecret();
    return createHmac('sha256', secret)
      .update(encodedPayload)
      .digest('base64url');
  }

  private getStateSecret(): string {
    return (
      this.configService.get<string>('oauth.tokenEncryptionKey') ??
      this.configService.get<string>('jwt.secret') ??
      'dev-oauth-state-secret'
    );
  }
}
