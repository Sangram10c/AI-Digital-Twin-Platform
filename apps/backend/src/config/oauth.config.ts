import { registerAs } from '@nestjs/config';

const DEFAULT_GITHUB_SCOPES = ['read:user', 'user:email'];

export default registerAs('oauth', () => ({
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL,
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackUrl: process.env.GITHUB_CALLBACK_URL,
    scopes: (process.env.GITHUB_OAUTH_SCOPES ?? DEFAULT_GITHUB_SCOPES.join(' '))
      .split(/[\s,]+/)
      .map((scope) => scope.trim())
      .filter(Boolean),
    webhookSecret: process.env.GITHUB_WEBHOOK_SECRET,
    successRedirectUrl:
      process.env.GITHUB_OAUTH_SUCCESS_REDIRECT ??
      process.env.CORS_ORIGIN ??
      'http://localhost:3000',
    errorRedirectUrl:
      process.env.GITHUB_OAUTH_ERROR_REDIRECT ??
      process.env.CORS_ORIGIN ??
      'http://localhost:3000',
    stateTtlSeconds: Number(process.env.GITHUB_OAUTH_STATE_TTL_SECONDS ?? 600),
    authorizeUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    apiBaseUrl: 'https://api.github.com',
  },
  tokenEncryptionKey: process.env.OAUTH_TOKEN_ENCRYPTION_KEY,
}));
