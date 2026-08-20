'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SystemHealthReport } from '@/services/analytics.service';

interface RepositoryHealthProps {
  health?: SystemHealthReport;
}

export function RepositoryHealth({ health }: RepositoryHealthProps) {
  const components = [
    {
      name: 'Repository Sync',
      status: health?.components?.repositorySync?.status || 'HEALTHY',
      description:
        health?.components?.repositorySync?.message || 'Git webhook & delta sync operational',
    },
    {
      name: 'Embedding Pipeline',
      status: health?.components?.embeddingPipeline?.status || 'HEALTHY',
      description: health?.components?.embeddingPipeline?.message || 'pgvector indexing active',
    },
    {
      name: 'Hybrid Search Engine',
      status: health?.components?.hybridSearch?.status || 'HEALTHY',
      description:
        health?.components?.hybridSearch?.message || 'BM25 keyword + Cosine vector operational',
    },
    {
      name: 'AI Inference Providers',
      status: health?.components?.aiProviders?.status || 'HEALTHY',
      description:
        health?.components?.aiProviders?.message || 'Google Gemini & LLM fallbacks available',
    },
    {
      name: 'Background BullMQ',
      status: health?.components?.bullmqQueues?.status || 'HEALTHY',
      description: health?.components?.bullmqQueues?.message || 'Async workers processing jobs',
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'HEALTHY':
      case 'OPTIMAL':
        return (
          <Badge variant="success" size="sm" dot className="font-mono text-[10px]">
            Healthy
          </Badge>
        );
      case 'DEGRADED':
        return (
          <Badge variant="warning" size="sm" dot className="font-mono text-[10px]">
            Degraded
          </Badge>
        );
      case 'UNHEALTHY':
      case 'FAILED':
        return (
          <Badge variant="destructive" size="sm" dot className="font-mono text-[10px]">
            Unhealthy
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" size="sm" className="font-mono text-[10px]">
            {status}
          </Badge>
        );
    }
  };

  return (
    <Card className="border border-slate-800 bg-[#0b101f] p-6 rounded-2xl shadow-xl space-y-4">
      <CardHeader className="p-0 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-bold text-white">System & Engine Health</CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Telemetry status of core ingestion, embedding, and inference layers.
          </CardDescription>
        </div>
        {getStatusBadge(health?.overallStatus || 'HEALTHY')}
      </CardHeader>

      <CardContent className="p-0 pt-2 space-y-2.5">
        {components.map((c) => (
          <div
            key={c.name}
            className="flex items-center justify-between p-3 rounded-xl border border-slate-800/60 bg-slate-900/30"
          >
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-white">{c.name}</div>
              <div className="text-[11px] text-slate-400 font-mono">{c.description}</div>
            </div>
            {getStatusBadge(c.status)}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
