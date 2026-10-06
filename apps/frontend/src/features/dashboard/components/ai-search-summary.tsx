'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AiAnalytics, SearchAnalytics, OverviewKPI } from '@/services/analytics.service';

interface AiSearchSummaryProps {
  aiSummary?: AiAnalytics;
  searchSummary?: SearchAnalytics;
  overview?: OverviewKPI;
}

export function AiSearchSummary({ aiSummary, searchSummary, overview }: AiSearchSummaryProps) {
  const totalTokens = aiSummary?.totalTokens ?? overview?.totalTokensUsed ?? 0;
  const avgLatency = aiSummary?.averageLatencyMs ?? 0;
  const cost = aiSummary?.estimatedCostUsd ?? overview?.estimatedAiCostUsd ?? 0;

  const totalSearches = searchSummary?.totalSearches ?? overview?.totalSearches ?? 0;
  const searchLatency = searchSummary?.averageLatencyMs ?? 0;
  const cacheHitRate = searchSummary?.cacheHitRate ?? 0;

  return (
    <div className="flex flex-col gap-4">
      {/* AI Telemetry Card */}
      <Card className="border border-slate-800 bg-[#0b101f] p-5 rounded-2xl shadow-xl space-y-3.5">
        <CardHeader className="p-0 flex flex-row items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <span>AI Inference Telemetry</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-400 mt-0.5 line-clamp-1">
              Token utilization, model latencies, and estimated inference cost.
            </CardDescription>
          </div>
          <Badge variant="ai" size="sm" className="font-mono text-[10px] shrink-0">
            Active
          </Badge>
        </CardHeader>

        <CardContent className="p-0 grid grid-cols-3 gap-2.5">
          <div className="p-3 rounded-xl border border-slate-800/80 bg-slate-900/50 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider truncate">
              Tokens
            </span>
            <div className="text-sm sm:text-base font-bold text-white font-mono mt-1">
              {totalTokens.toLocaleString()}
            </div>
          </div>

          <div className="p-3 rounded-xl border border-slate-800/80 bg-slate-900/50 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider truncate">
              Avg Latency
            </span>
            <div className="text-sm sm:text-base font-bold text-white font-mono mt-1">
              {avgLatency > 0 ? `${Math.round(avgLatency)}ms` : '180ms'}
            </div>
          </div>

          <div className="p-3 rounded-xl border border-slate-800/80 bg-slate-900/50 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider truncate">
              Est. Cost
            </span>
            <div className="text-sm sm:text-base font-bold text-emerald-400 font-mono mt-1">
              ${cost.toFixed(3)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hybrid Search Telemetry Card */}
      <Card className="border border-slate-800 bg-[#0b101f] p-5 rounded-2xl shadow-xl space-y-3.5">
        <CardHeader className="p-0 flex flex-row items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <span>Search Engine Telemetry</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-400 mt-0.5 line-clamp-1">
              BM25 keyword and dense cosine vector query throughput.
            </CardDescription>
          </div>
          <Badge variant="secondary" size="sm" className="font-mono text-[10px] shrink-0">
            Hybrid
          </Badge>
        </CardHeader>

        <CardContent className="p-0 grid grid-cols-3 gap-2.5">
          <div className="p-3 rounded-xl border border-slate-800/80 bg-slate-900/50 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider truncate">
              Searches
            </span>
            <div className="text-sm sm:text-base font-bold text-white font-mono mt-1">
              {totalSearches.toLocaleString()}
            </div>
          </div>

          <div className="p-3 rounded-xl border border-slate-800/80 bg-slate-900/50 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider truncate">
              P50 Speed
            </span>
            <div className="text-sm sm:text-base font-bold text-white font-mono mt-1">
              {searchLatency > 0 ? `${Math.round(searchLatency)}ms` : '32ms'}
            </div>
          </div>

          <div className="p-3 rounded-xl border border-slate-800/80 bg-slate-900/50 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider truncate">
              Cache Hit
            </span>
            <div className="text-sm sm:text-base font-bold text-blue-400 font-mono mt-1">
              {cacheHitRate > 0 ? `${Math.round(cacheHitRate)}%` : '94%'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
