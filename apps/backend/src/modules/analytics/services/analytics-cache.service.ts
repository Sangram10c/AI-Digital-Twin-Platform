import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../../common/modules/redis.module';

@Injectable()
export class AnalyticsCacheService {
  private readonly logger = new Logger(AnalyticsCacheService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  /**
   * Constructs a standardized cache key.
   */
  buildKey(
    category: string,
    workspaceId: string,
    repositoryId?: string,
    period = 'daily',
  ): string {
    const repoPart = repositoryId ? `:repo:${repositoryId}` : '';
    return `analytics:${category}:ws:${workspaceId}${repoPart}:${period}`;
  }

  /**
   * Retrieves parsed JSON from Redis cache. Returns null on miss or error.
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.redis.status !== 'ready' && this.redis.status !== 'connecting') {
        return null;
      }
      const data = await this.redis.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Redis get cache error for ${key}: ${msg}`);
      return null;
    }
  }

  /**
   * Stores value as JSON string with TTL in seconds.
   */
  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    try {
      if (this.redis.status !== 'ready' && this.redis.status !== 'connecting') {
        return;
      }
      const serialized = JSON.stringify(value);
      await this.redis.set(key, serialized, 'EX', ttlSeconds);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Redis set cache error for ${key}: ${msg}`);
    }
  }

  /**
   * Invalidates all cache keys matching pattern for a workspace.
   */
  async invalidateWorkspace(workspaceId: string): Promise<void> {
    try {
      if (this.redis.status !== 'ready') return;
      const pattern = `analytics:*:ws:${workspaceId}*`;
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.logger.debug(
          `Invalidated ${keys.length} analytics cache keys for workspace ${workspaceId}`,
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Failed to invalidate cache for workspace ${workspaceId}: ${msg}`,
      );
    }
  }
}
