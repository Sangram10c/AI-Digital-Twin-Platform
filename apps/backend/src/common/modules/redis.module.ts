import { Global, Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('RedisModule');
        const redisUrl = configService.get<string>('redis.url');
        const host = configService.get<string>('redis.host') || 'localhost';
        const port = configService.get<number>('redis.port') || 6379;
        const password = configService.get<string>('redis.password');
        const db = configService.get<number>('redis.db') || 0;

        const commonOptions: RedisOptions = {
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
          lazyConnect: true,
          retryStrategy(times) {
            // Exponential backoff capped at 10 seconds
            const delay = Math.min(times * 1000, 10000);
            return delay;
          },
        };

        let client: Redis;

        if (redisUrl) {
          client = new Redis(redisUrl, commonOptions);
        } else {
          client = new Redis({
            ...commonOptions,
            host,
            port,
            password: password || undefined,
            db,
          });
        }

        client.on('connect', () => logger.log('Redis connected successfully'));
        client.on('error', (err: Error) =>
          logger.warn(`Redis connection warning: ${err.message}`),
        );

        // Attempt initial connection asynchronously without blocking startup
        client.connect().catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          logger.warn(`Redis initial connect deferred: ${msg}`);
        });

        return client;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
