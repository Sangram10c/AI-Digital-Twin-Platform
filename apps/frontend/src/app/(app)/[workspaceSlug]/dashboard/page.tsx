'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function WorkspaceDashboardPage() {
  const params = useParams();
  const slug = (params?.workspaceSlug as string) || 'default';

  const stats = [
    { title: 'Connected Repositories', value: '4', change: '+1 this week', badge: 'Active' },
    {
      title: 'Indexed Knowledge Chunks',
      value: '1,842',
      change: '100% Embedded',
      badge: 'pgvector',
    },
    { title: 'AI Conversations', value: '38', change: '99.4% grounded', badge: '10-Step RAG' },
    { title: 'Search Queries (7d)', value: '256', change: 'avg 42ms latency', badge: 'Hybrid' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground sm:text-2xl capitalize">
              {slug.replace(/-/g, ' ')} Workspace
            </h1>
            <Badge variant="ai" size="sm">
              RAG Active
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Repository synchronization, hybrid search indexing, and AI conversational intelligence.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href={`/${slug}/search`}>
            <Button variant="outline" size="sm">
              Search Code
            </Button>
          </Link>
          <Link href={`/${slug}/chat`}>
            <Button variant="ai" size="sm">
              New AI Chat
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{stat.title}</span>
              <Badge size="sm" variant="secondary">
                {stat.badge}
              </Badge>
            </div>
            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            <div className="text-[11px] text-success font-medium">{stat.change}</div>
          </Card>
        ))}
      </div>

      {/* Quick Launch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card interactive className="p-5">
          <Link href={`/${slug}/chat`} className="block space-y-2">
            <div className="text-lg">🤖</div>
            <CardTitle className="text-sm">Ask the Digital Twin</CardTitle>
            <CardDescription className="text-xs">
              Query architectural decisions, commit history, and code logic using 10-step RAG.
            </CardDescription>
          </Link>
        </Card>

        <Card interactive className="p-5">
          <Link href={`/${slug}/search`} className="block space-y-2">
            <div className="text-lg">🔍</div>
            <CardTitle className="text-sm">Hybrid Code Search</CardTitle>
            <CardDescription className="text-xs">
              Search across commits, PR discussions, and symbol-aware TypeScript/JS code chunks.
            </CardDescription>
          </Link>
        </Card>

        <Card interactive className="p-5">
          <Link href={`/${slug}/analytics`} className="block space-y-2">
            <div className="text-lg">📊</div>
            <CardTitle className="text-sm">8-Domain Analytics</CardTitle>
            <CardDescription className="text-xs">
              Inspect AI provider costs, token usage, search latency, and BullMQ queue throughput.
            </CardDescription>
          </Link>
        </Card>
      </div>
    </div>
  );
}
