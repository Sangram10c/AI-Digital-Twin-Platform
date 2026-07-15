import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { PrismaService } from '../../database/prisma.service';

export interface HealthCheckResult {
  status: 'ok' | 'error';
  timestamp: string;
}

export interface ReadinessResult extends HealthCheckResult {
  checks: {
    database: 'up' | 'down';
    redis: 'up' | 'down' | 'skipped';
  };
}

export interface HealthSummary extends ReadinessResult {
  application: string;
  version: string;
  environment: string;
}

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  getLive(): HealthCheckResult {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  async getReady(): Promise<ReadinessResult> {
    const databaseHealthy = await this.prisma.isHealthy();
    const redisStatus = await this.checkRedis();

    const redisOk = redisStatus === 'up' || redisStatus === 'skipped';
    const status = databaseHealthy && redisOk ? 'ok' : 'error';

    return {
      status,
      checks: {
        database: databaseHealthy ? 'up' : 'down',
        redis: redisStatus,
      },
      timestamp: new Date().toISOString(),
    };
  }

  async getHealth(): Promise<HealthSummary> {
    const ready = await this.getReady();

    return {
      ...ready,
      application:
        this.configService.get<string>('app.name') ?? 'AI Digital Twin',
      version: '1.0.0',
      environment:
        this.configService.get<string>('app.nodeEnv') ?? 'development',
    };
  }

  private async checkRedis(): Promise<'up' | 'down' | 'skipped'> {
    const enabled = this.configService.get<boolean>('redis.enabled');
    const redisUrl = this.configService.get<string>('redis.url');

    if (!enabled || !redisUrl) {
      return 'skipped';
    }

    const client = new Redis(redisUrl, {
      lazyConnect: true,
      connectTimeout: 3000,
      maxRetriesPerRequest: 1,
    });

    try {
      await client.connect();
      const pong = await client.ping();
      return pong === 'PONG' ? 'up' : 'down';
    } catch {
      return 'down';
    } finally {
      client.disconnect();
    }
  }
}
