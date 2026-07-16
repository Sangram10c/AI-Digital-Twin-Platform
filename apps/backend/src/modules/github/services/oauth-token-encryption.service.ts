import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { decryptSecret, encryptSecret } from '../utils/token-encryption.util';

@Injectable()
export class OAuthTokenEncryptionService {
  constructor(private readonly configService: ConfigService) {}

  encrypt(plaintext: string): string {
    const key = this.getEncryptionKey();
    return encryptSecret(plaintext, key);
  }

  decrypt(ciphertext: string): string {
    const key = this.getEncryptionKey();
    try {
      return decryptSecret(ciphertext, key);
    } catch {
      throw new InternalServerErrorException('Failed to decrypt OAuth token');
    }
  }

  private getEncryptionKey(): string {
    const key = this.configService.get<string>('oauth.tokenEncryptionKey');
    if (!key) {
      throw new InternalServerErrorException(
        'OAuth token encryption key is not configured',
      );
    }
    return key;
  }
}
