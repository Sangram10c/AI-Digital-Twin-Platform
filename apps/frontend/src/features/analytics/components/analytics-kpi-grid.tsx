'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  OverviewKPI,
  AiAnalytics,
  SearchAnalytics,
  JobAnalytics,
} from '@/services/analytics.service';

interface AnalyticsKpiGridProps {
  overview?: OverviewKPI;
  ai?: AiAnalytics;
  search?: SearchAnalytics;
  jobs?: JobAnalytics;
}

export function AnalyticsKpiGrid({ overview, ai, search, jobs }: AnalyticsKpiGridProps) {
  const cards = [
    {
      title: 'Connected Repositories',
      value: (overview?.totalRepositories ?? 0).toString(),
      subtext: `${overview?.totalKnowledgeChunks?.toLocaleString() ?? 0} pgvector chunks`,
      icon: '📦',
      badge: 'Codebase Scope',
    },
    {
      title: 'AI Tokens & Inference',
      value: (ai?.totalTokens ?? overview?.totalTokensUsed ?? 0).toLocaleString(),
      subtext: `$${ai?.estimatedCostUsd?.toFixed(4) ?? '0.0000'} est. cost (${ai?.totalRequests ?? 0} calls)`,
      icon: '⚡',
      badge: 'AI Telemetry',
    },
    {
      title: 'Search Latency (P50)',
      value: `${search?.averageLatencyMs ?? 0}ms`,
      subtext: `${search?.totalQueries ?? overview?.totalSearches ?? 0} queries • ${((search?.cacheHitRate ?? 0) * 100).toFixed(0)}% cache`,
      icon: '🔍',
      badge: 'Hybrid Engine',
    },
    {
      title: 'Job Processing Rate',
      value: `${jobs?.successRate ?? 100}%`,
      subtext: `${jobs?.completedJobs ?? 0} completed • ${jobs?.failedJobs ?? 0} failed`,
      icon: '🔄',
      badge: 'BullMQ Queues',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Card
          key={c.title}
          className="p-5 border border-slate-800/80 bg-[#0b101f] rounded-2xl shadow-xl space-y-2 hover:border-slate-700 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">{c.title}</span>
            <span className="text-sm">{c.icon}</span>
          </div>

          <div className="text-2xl font-extrabold text-white font-mono tracking-tight">
            {c.value}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-800/60">
            <span className="truncate max-w-[160px]">{c.subtext}</span>
            <Badge
              variant="outline"
              size="sm"
              className="font-mono text-[9px] shrink-0 text-slate-400"
            >
              {c.badge}
            </Badge>
          </div>
        </Card>
      ))}
    </div>
  );
}
