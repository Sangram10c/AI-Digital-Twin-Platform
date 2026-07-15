import { registerAs } from '@nestjs/config';

export default registerAs('bullmq', () => ({
  prefix: process.env.QUEUE_PREFIX || 'ai-twin',
  connection: {
    url: process.env.REDIS_URL,
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },
}));
