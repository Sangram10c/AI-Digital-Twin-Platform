/**
 * Admin Service
 * Connects to NestJS platform health, readiness, and operator endpoints
 */
import { api } from './api.service';

export interface SystemProbeResponse {
  status: 'ok' | 'degraded' | 'unhealthy';
  timestamp?: string;
  details?: {
    database?: { status: string; latency?: number };
    redis?: { status: string; latency?: number };
    memory?: { usedMb: number; totalMb: number };
  };
}

export const adminService = {
  /**
   * Get application health summary
   */
  async getHealth(): Promise<SystemProbeResponse> {
    try {
      const { data } = await api.get<SystemProbeResponse>('/health', {
        baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000',
      });
      return data || { status: 'ok' };
    } catch {
      return { status: 'degraded' };
    }
  },

  /**
   * Get readiness probe (database + Redis)
   */
  async getReadiness(): Promise<SystemProbeResponse> {
    try {
      const { data } = await api.get<SystemProbeResponse>('/ready', {
        baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000',
      });
      return data || { status: 'ok' };
    } catch {
      return { status: 'degraded' };
    }
  },
};
