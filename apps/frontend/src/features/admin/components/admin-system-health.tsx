'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SystemProbeResponse } from '@/services/admin.service';

interface AdminSystemHealthProps {
  health?: SystemProbeResponse;
  readiness?: SystemProbeResponse;
}

export function AdminSystemHealth({ health, readiness }: AdminSystemHealthProps) {
  const isHealthy = health?.status === 'ok' && readiness?.status === 'ok';

  const components = [
    {
      name: 'NestJS REST & SSE Gateway',
      type: 'Core API Layer',
      status: health?.status === 'ok' ? 'HEALTHY' : 'DEGRADED',
      icon: '⚡',
      metric: 'HTTP / SSE v1',
    },
    {
      name: 'PostgreSQL Database & pgvector',
      type: 'Primary Persistence & 768d Vector Store',
      status: readiness?.status === 'ok' ? 'HEALTHY' : 'DEGRADED',
      icon: '🐘',
      metric: 'Prisma Connection Pool',
    },
    {
      name: 'Redis Cache & Pub/Sub',
      type: 'In-Memory Cache & RRF Reranking Store',
      status: readiness?.status === 'ok' ? 'HEALTHY' : 'DEGRADED',
      icon: '🟥',
      metric: 'Redis ≥ 5.0 (BullMQ)',
    },
    {
      name: 'BullMQ Job Processor',
      type: 'Distributed Async Worker Pipelines',
      status: 'HEALTHY',
      icon: '🔄',
      metric: 'Async Jobs Engine',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-white tracking-tight">
          System Infrastructure Health
        </h2>
        <Badge
          variant={isHealthy ? 'success' : 'warning'}
          size="sm"
          dot
          className="font-mono text-[10px]"
        >
          {isHealthy ? 'All Systems Operational' : 'Degraded Telemetry'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {components.map((c) => (
          <Card
            key={c.name}
            className="p-4 rounded-2xl border border-slate-800 bg-[#0b101f] shadow-lg space-y-2.5 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-base">{c.icon}</span>
              <Badge
                variant={c.status === 'HEALTHY' ? 'success' : 'destructive'}
                size="sm"
                className="font-mono text-[9px]"
              >
                {c.status}
              </Badge>
            </div>

            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-white truncate">{c.name}</h4>
              <p className="text-[11px] text-slate-400 leading-tight">{c.type}</p>
            </div>

            <div className="text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800/60 flex justify-between">
              <span>{c.metric}</span>
              <span className="text-emerald-400">Online</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
