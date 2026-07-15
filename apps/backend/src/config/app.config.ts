import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  name: process.env.APP_NAME || 'AI Digital Twin',
  port: parseInt(process.env.BACKEND_PORT || '4000', 10),
  host: process.env.BACKEND_HOST || '0.0.0.0',
  apiPrefix: process.env.API_PREFIX || 'api',
  apiVersion: process.env.API_VERSION || 'v1',
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  corsCredentials: process.env.CORS_CREDENTIALS !== 'false',
  trustProxy: process.env.TRUST_PROXY === 'true',
  bodyLimit: process.env.BODY_LIMIT || '1mb',
  logLevel: process.env.LOG_LEVEL || 'info',
  throttleTtl: parseInt(process.env.THROTTLE_TTL || '60', 10),
  throttleLimit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
  isProduction: process.env.NODE_ENV === 'production',
}));
