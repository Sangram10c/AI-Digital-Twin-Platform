'use client';

import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function TimelinePage() {
  const events = [
    {
      date: '2026-08-18',
      type: 'PHASE_COMPLETE',
      title: 'Phase 13: Analytics & Insights Implemented',
      description: 'Added 8-domain metrics aggregation, BullMQ worker, and Redis caching.',
      author: 'Backend Team',
    },
    {
      date: '2026-08-16',
      type: 'COMMIT',
      title: 'feat: restore pgvector HNSW search indexes',
      description: 'Restored high-performance HNSW index on embeddings.vector table.',
      author: 'Database Engineer',
    },
    {
      date: '2026-08-12',
      type: 'RELEASE',
      title: 'v0.9.0-alpha: 10-Step RAG Assistant Live',
      description: 'First end-to-end grounded AI conversation pipeline with citations.',
      author: 'AI Team',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">Engineering Timeline</h1>
        <p className="text-xs text-muted-foreground">
          Chronological time-series of repository commits, PR merges, architectural milestones, and
          releases.
        </p>
      </div>

      <div className="relative border-l border-border ml-4 space-y-6 pl-6">
        {events.map((event, i) => (
          <div key={i} className="relative">
            <div className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full border-2 border-background bg-primary" />
            <Card className="p-4 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-muted-foreground text-[10px]">{event.date}</span>
                <Badge size="sm" variant="secondary">
                  {event.type}
                </Badge>
              </div>
              <CardTitle className="text-sm">{event.title}</CardTitle>
              <CardDescription className="text-xs">{event.description}</CardDescription>
              <div className="text-[10px] text-muted-foreground pt-1">By {event.author}</div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
