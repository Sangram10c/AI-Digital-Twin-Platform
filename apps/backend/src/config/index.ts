import appConfig from './app.config';
import aiConfig from './ai.config';
import bullmqConfig from './bullmq.config';
import databaseConfig from './database.config';
import { envValidationSchema } from './env.validation';
import jwtConfig from './jwt.config';
import oauthConfig from './oauth.config';
import redisConfig from './redis.config';
import storageConfig from './storage.config';

export const configNamespaces = [
  appConfig,
  databaseConfig,
  jwtConfig,
  redisConfig,
  oauthConfig,
  aiConfig,
  storageConfig,
  bullmqConfig,
];

export {
  appConfig,
  aiConfig,
  bullmqConfig,
  databaseConfig,
  envValidationSchema,
  jwtConfig,
  oauthConfig,
  redisConfig,
  storageConfig,
};
