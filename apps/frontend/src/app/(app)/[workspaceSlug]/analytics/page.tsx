'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AnalyticsPage() {
  const domains = [
    { title: 'Repository Metrics', count: '4 repos', desc: 'Commits, branches, lines changed' },
    {
      title: 'AI Provider Usage',
      count: '14,200 tokens',
      desc: 'Token usage, latency, estimated cost',
    },
    {
      title: 'Search Performance',
      count: '42ms avg',
      desc: 'Query volume, cache hits, zero-result queries',
    },
    {
      title: 'Knowledge Base',
      count: '1,842 chunks',
      desc: 'Chunk size distribution, embedding status',
    },
    { title: 'Conversations', count: '38 threads', desc: 'Message volume, turns per conversation' },
    {
      title: 'Background Jobs',
      count: '100% success',
      desc: 'BullMQ queues, retry counts, latency',
    },
    {
      title: 'RAG Grounding',
      count: '99.4% precision',
      desc: 'Citation traceability, source diversity',
    },
    {
      title: 'Workspace Summary',
      count: 'Health: Optimal',
      desc: 'Combined 30-day rollup snapshot',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">
              Analytics & Insights Dashboard
            </h1>
            <Badge variant="ai" size="sm">
              Phase 13
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            8-domain aggregated metrics, BullMQ background jobs, and Redis caching.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {domains.map((dom) => (
          <Card key={dom.title} className="p-4 space-y-2">
            <div className="text-xs font-semibold text-foreground">{dom.title}</div>
            <div className="text-xl font-bold text-primary font-mono">{dom.count}</div>
            <p className="text-[11px] text-muted-foreground">{dom.desc}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
