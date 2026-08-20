/**
 * Admin Feature Types
 */

export interface SystemHealthProbe {
  status: 'ok' | 'degraded' | 'unhealthy';
  timestamp?: string;
  databaseStatus: 'HEALTHY' | 'UNHEALTHY' | 'DEGRADED';
  redisStatus: 'HEALTHY' | 'UNHEALTHY' | 'DEGRADED';
  apiStatus: 'HEALTHY' | 'UNHEALTHY' | 'DEGRADED';
}

export interface AdminQueueItem {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  status: 'HEALTHY' | 'DEGRADED' | 'IDLE';
}

export interface AdminProviderItem {
  provider: string;
  model: string;
  latencyMs: number;
  totalTokens: number;
  status: 'ACTIVE' | 'STANDBY';
}
