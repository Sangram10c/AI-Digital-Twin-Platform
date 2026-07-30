import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { SEARCH_REDIS_KEYS } from '../constants/search.constants';
import { PrismaService } from '../../../database/prisma.service';

export interface SearchMetricEvent {
  workspaceId: string;
  mode: string;
  totalMs: number;
  vectorMs: number;
  keywordMs: number;
  embeddingMs: number;
  cacheHit: boolean;
  resultsCount: number;
  repositoryId?: string | null;
  query: string;
}

@Injectable()
export class SearchMetricsService {
  private readonly logger = new Logger(SearchMetricsService.name);
  private redis: Redis | null = null;
  private initAttempted = false;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async record(event: SearchMetricEvent): Promise<void> {
    const redis = await this.client();
    if (!redis) return;
    const key = SEARCH_REDIS_KEYS.metrics(event.workspaceId);
    try {
      const pipe = redis.pipeline();
      pipe.hincrby(key, 'searchCount', 1);
      pipe.hincrby(key, 'totalLatencyMs', Math.round(event.totalMs));
      pipe.hincrby(key, 'vectorLatencyMs', Math.round(event.vectorMs));
      pipe.hincrby(key, 'keywordLatencyMs', Math.round(event.keywordMs));
      pipe.hincrby(key, 'embeddingLatencyMs', Math.round(event.embeddingMs));
      pipe.hincrby(key, event.cacheHit ? 'cacheHits' : 'cacheMisses', 1);
      pipe.hincrby(key, `mode:${event.mode}`, 1);
      pipe.expire(key, 30 * 24 * 3600);
      await pipe.exec();
    } catch (error) {
      this.logger.debug(
        `metrics record skipped: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async getStatistics(workspaceId: string) {
    const redis = await this.client();
    let redisStats: Record<string, string> = {};
    if (redis) {
      try {
        redisStats = await redis.hgetall(
          SEARCH_REDIS_KEYS.metrics(workspaceId),
        );
      } catch {
        redisStats = {};
      }
    }

    const searchCount = Number(redisStats.searchCount ?? 0);
    const totalLatency = Number(redisStats.totalLatencyMs ?? 0);
    const cacheHits = Number(redisStats.cacheHits ?? 0);
    const cacheMisses = Number(redisStats.cacheMisses ?? 0);
    const cacheTotal = cacheHits + cacheMisses;

    const [historyCount, topRepos, byType] = await Promise.all([
      this.prisma.searchHistory.count({ where: { workspaceId } }),
      this.prisma.searchHistory.groupBy({
        by: ['repositoryId'],
        where: { workspaceId, repositoryId: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { repositoryId: 'desc' } },
        take: 10,
      }),
      this.prisma.searchHistory.groupBy({
        by: ['searchType'],
        where: { workspaceId },
        _count: { _all: true },
      }),
    ]);

    return {
      workspaceId,
      searchCount: searchCount || historyCount,
      averageResponseTimeMs:
        searchCount > 0 ? Math.round(totalLatency / searchCount) : null,
      cacheHitRatio: cacheTotal > 0 ? cacheHits / cacheTotal : null,
      vectorSearchLatencyMsAvg:
        searchCount > 0
          ? Math.round(Number(redisStats.vectorLatencyMs ?? 0) / searchCount)
          : null,
      keywordSearchLatencyMsAvg:
        searchCount > 0
          ? Math.round(Number(redisStats.keywordLatencyMs ?? 0) / searchCount)
          : null,
      byMode: {
        hybrid: Number(redisStats['mode:hybrid'] ?? 0),
        vector: Number(redisStats['mode:vector'] ?? 0),
        keyword: Number(redisStats['mode:keyword'] ?? 0),
      },
      bySearchType: Object.fromEntries(
        byType.map((r) => [r.searchType, r._count._all]),
      ),
      mostSearchedRepositories: topRepos.map((r) => ({
        repositoryId: r.repositoryId,
        count: r._count._all,
      })),
    };
  }

  private async client(): Promise<Redis | null> {
    if (this.redis) return this.redis;
    if (this.initAttempted) return null;
    this.initAttempted = true;
    const url = this.config.get<string>('redis.url');
    try {
      this.redis = url
        ? new Redis(url, {
            maxRetriesPerRequest: 1,
            lazyConnect: true,
            enableReadyCheck: false,
          })
        : new Redis({
            host: this.config.get<string>('redis.host') || 'localhost',
            port: this.config.get<number>('redis.port') || 6379,
            password: this.config.get<string>('redis.password') || undefined,
            db: this.config.get<number>('redis.db') || 0,
            maxRetriesPerRequest: 1,
            lazyConnect: true,
            enableReadyCheck: false,
          });
      await this.redis.connect();
      return this.redis;
    } catch {
      this.redis = null;
      return null;
    }
  }
}
