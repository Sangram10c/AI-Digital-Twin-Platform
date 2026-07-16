import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { GITHUB_SIGNATURE_HEADER } from '../constants/webhook.constants';

@Injectable()
export class WebhookSignatureService {
  constructor(private readonly configService: ConfigService) {}

  getWebhookSecret(): string {
    const secret = this.configService.get<string>('oauth.github.webhookSecret');
    if (!secret) {
      throw new UnauthorizedException(
        'GITHUB_WEBHOOK_SECRET is not configured',
      );
    }
    return secret;
  }

  /**
   * Verifies X-Hub-Signature-256 (sha256=<hex>) using timing-safe compare.
   */
  verifySignature(rawBody: Buffer, signatureHeader: string | undefined): void {
    if (!signatureHeader) {
      throw new UnauthorizedException(
        `Missing ${GITHUB_SIGNATURE_HEADER} header`,
      );
    }

    const [algo, hash] = signatureHeader.split('=');
    if (algo !== 'sha256' || !hash) {
      throw new BadRequestException('Invalid webhook signature format');
    }

    const secret = this.getWebhookSecret();
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');

    const provided = Buffer.from(hash, 'utf8');
    const computed = Buffer.from(expected, 'utf8');

    if (
      provided.length !== computed.length ||
      !timingSafeEqual(provided, computed)
    ) {
      throw new UnauthorizedException('Invalid webhook signature');
    }
  }
}
