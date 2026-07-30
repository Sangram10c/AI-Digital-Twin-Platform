import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, SearchType } from '@prisma/client';
import { createHash } from 'crypto';
import Redis from 'ioredis';
import { PrismaService } from '../../../database/prisma.service';
import { SEARCH_REDIS_KEYS } from '../constants/search.constants';
import type { SearchResponse } from '../interfaces/search.interfaces';

@Injectable()
export class SearchCacheService {
  private readonly logger = new Logger(SearchCacheService.name);
  private redis: Redis | null = null;
  private initAttempted = false;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  enabled(): boolean {
    return this.config.get<boolean>('search.enableCache') !== false;
  }

  hashKey(parts: Record<string, unknown>): string {
    return createHash('sha256').update(JSON.stringify(parts)).digest('hex');
  }

  async getResult(hash: string): Promise<SearchResponse | null> {
    if (!this.enabled()) return null;
    const redis = await this.client();
    if (redis) {
      try {
        const raw = await redis.get(SEARCH_REDIS_KEYS.result(hash));
        if (raw) return JSON.parse(raw) as SearchResponse;
      } catch (error) {
        this.logger.warn(
          `Redis getResult failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    const row = await this.prisma.searchCache.findUnique({
      where: { queryHash: hash },
    });
    if (!row || row.expiresAt.getTime() < Date.now()) {
      if (row) {
        await this.prisma.searchCache
          .delete({ where: { id: row.id } })
          .catch(() => undefined);
      }
      return null;
    }
    return row.results as unknown as SearchResponse;
  }

  async setResult(
    hash: string,
    searchType: SearchType,
    payload: SearchResponse,
  ): Promise<void> {
    if (!this.enabled()) return;
    const ttl = this.config.get<number>('search.cacheTtlSeconds') ?? 300;
    if (ttl <= 0) return;

    const redis = await this.client();
    if (redis) {
      try {
        await redis.set(
          SEARCH_REDIS_KEYS.result(hash),
          JSON.stringify(payload),
          'EX',
          ttl,
        );
      } catch (error) {
        this.logger.warn(
          `Redis setResult failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    const expiresAt = new Date(Date.now() + ttl * 1000);
    const resultsJson = JSON.parse(
      JSON.stringify(payload),
    ) as Prisma.InputJsonValue;
    await this.prisma.searchCache
      .upsert({
        where: { queryHash: hash },
        create: {
          queryHash: hash,
          searchType,
          results: resultsJson,
          expiresAt,
        },
        update: {
          searchType,
          results: resultsJson,
          expiresAt,
        },
      })
      .catch((error: unknown) => {
        this.logger.warn(
          `DB search cache upsert failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      });
  }

  async getEmbedding(hash: string): Promise<number[] | null> {
    if (!this.enabled()) return null;
    const redis = await this.client();
    if (!redis) return null;
    try {
      const raw = await redis.get(SEARCH_REDIS_KEYS.embedding(hash));
      if (!raw) return null;
      return JSON.parse(raw) as number[];
    } catch {
      return null;
    }
  }

  async setEmbedding(hash: string, vector: number[]): Promise<void> {
    if (!this.enabled()) return;
    const ttl =
      this.config.get<number>('search.embeddingCacheTtlSeconds') ?? 3600;
    if (ttl <= 0) return;
    const redis = await this.client();
    if (!redis) return;
    try {
      await redis.set(
        SEARCH_REDIS_KEYS.embedding(hash),
        JSON.stringify(vector),
        'EX',
        ttl,
      );
    } catch (error) {
      this.logger.warn(
        `Redis setEmbedding failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async trackPopular(workspaceId: string, query: string): Promise<void> {
    const redis = await this.client();
    if (!redis) return;
    try {
      const key = SEARCH_REDIS_KEYS.popular(workspaceId);
      await redis.zincrby(key, 1, query.slice(0, 200));
      await redis.expire(key, 7 * 24 * 3600);
    } catch {
      /* optional */
    }
  }

  async getPopular(
    workspaceId: string,
    limit = 20,
  ): Promise<Array<{ query: string; count: number }>> {
    const redis = await this.client();
    if (redis) {
      try {
        const rows = await redis.zrevrange(
          SEARCH_REDIS_KEYS.popular(workspaceId),
          0,
          limit - 1,
          'WITHSCORES',
        );
        const out: Array<{ query: string; count: number }> = [];
        for (let i = 0; i < rows.length; i += 2) {
          out.push({
            query: rows[i],
            count: Number(rows[i + 1] ?? 0),
          });
        }
        if (out.length) return out;
      } catch {
        /* fall through */
      }
    }

    const grouped = await this.prisma.searchHistory.groupBy({
      by: ['query'],
      where: { workspaceId },
      _count: { query: true },
      orderBy: { _count: { query: 'desc' } },
      take: limit,
    });
    return grouped.map((g) => ({
      query: g.query,
      count: g._count.query,
    }));
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
            enableReadyCheck: false,
            lazyConnect: true,
          })
        : new Redis({
            host: this.config.get<string>('redis.host') || 'localhost',
            port: this.config.get<number>('redis.port') || 6379,
            password: this.config.get<string>('redis.password') || undefined,
            db: this.config.get<number>('redis.db') || 0,
            maxRetriesPerRequest: 1,
            enableReadyCheck: false,
            lazyConnect: true,
          });
      await this.redis.connect();
      return this.redis;
    } catch (error) {
      this.logger.warn(
        `Search Redis unavailable: ${error instanceof Error ? error.message : String(error)}`,
      );
      this.redis = null;
      return null;
    }
  }
}
