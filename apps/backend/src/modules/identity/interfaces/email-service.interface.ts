export interface IEmailService {
  sendWelcomeEmail(to: string, displayName: string): Promise<void>;
  sendVerificationEmail(to: string, token: string): Promise<void>;
  sendPasswordResetEmail(to: string, token: string): Promise<void>;
}

export const EMAIL_SERVICE = Symbol('EMAIL_SERVICE');
