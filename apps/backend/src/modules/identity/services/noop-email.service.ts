import { Injectable, Logger } from '@nestjs/common';
import {
  EMAIL_SERVICE,
  IEmailService,
} from '../interfaces/email-service.interface';

@Injectable()
export class NoopEmailService implements IEmailService {
  private readonly logger = new Logger(NoopEmailService.name);

  sendWelcomeEmail(to: string, displayName: string): Promise<void> {
    this.logger.log(`[EMAIL:WELCOME] to=${to} name=${displayName}`);
    return Promise.resolve();
  }

  sendVerificationEmail(to: string, token: string): Promise<void> {
    this.logger.log(
      `[EMAIL:VERIFY] to=${to} token=${this.formatDevToken(token)}`,
    );
    return Promise.resolve();
  }

  sendPasswordResetEmail(to: string, token: string): Promise<void> {
    this.logger.log(
      `[EMAIL:RESET] to=${to} token=${this.formatDevToken(token)}`,
    );
    return Promise.resolve();
  }

  /** Log full token in dev (noop provider only — never use in production). */
  private formatDevToken(token: string): string {
    if (process.env.NODE_ENV === 'production') {
      return `${token.slice(0, 12)}...`;
    }
    return token;
  }
}

export const emailServiceProvider = {
  provide: EMAIL_SERVICE,
  useClass: NoopEmailService,
};
