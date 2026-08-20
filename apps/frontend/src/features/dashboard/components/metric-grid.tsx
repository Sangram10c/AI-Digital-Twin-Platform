'use client';

import { MetricCard } from './metric-card';
import { OverviewKPI } from '@/services/analytics.service';

interface MetricGridProps {
  overview?: OverviewKPI;
  repoCount: number;
  slug: string;
}

export function MetricGrid({ overview, repoCount, slug }: MetricGridProps) {
  const chunkCount = overview?.totalKnowledgeChunks ?? 0;
  const chatCount = overview?.totalConversations ?? 0;
  const searchCount = overview?.totalSearches ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Connected Repositories */}
      <MetricCard
        title="Connected Repositories"
        value={repoCount.toString()}
        subtitle={repoCount > 0 ? `${repoCount} active indexed` : 'No repositories linked'}
        badge={repoCount > 0 ? 'Active' : 'Empty'}
        badgeVariant={repoCount > 0 ? 'ai' : 'outline'}
        href={`/${slug}/repositories`}
        icon={
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
            <path d="M9 18c-4.51 2-5-2-7-2" />
          </svg>
        }
      />

      {/* 2. Knowledge Chunks */}
      <MetricCard
        title="Knowledge Chunks"
        value={chunkCount.toLocaleString()}
        subtitle={chunkCount > 0 ? 'pgvector embedded' : '0 vectors stored'}
        badge={chunkCount > 0 ? 'pgvector' : 'Pending'}
        badgeVariant={chunkCount > 0 ? 'success' : 'outline'}
        href={`/${slug}/knowledge`}
        icon={
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
            <path d="M6 6h10" />
            <path d="M6 10h10" />
          </svg>
        }
      />

      {/* 3. AI Conversations */}
      <MetricCard
        title="AI Conversations"
        value={chatCount.toString()}
        subtitle={chatCount > 0 ? '10-Step RAG grounded' : 'No chats yet'}
        badge={chatCount > 0 ? 'RAG' : 'Idle'}
        badgeVariant={chatCount > 0 ? 'ai' : 'outline'}
        href={`/${slug}/chat`}
        icon={
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        }
      />

      {/* 4. Search Queries */}
      <MetricCard
        title="Search Queries"
        value={searchCount.toString()}
        subtitle={searchCount > 0 ? 'Hybrid BM25 + Vector' : '0 searches executed'}
        badge={searchCount > 0 ? 'Hybrid' : 'Idle'}
        badgeVariant={searchCount > 0 ? 'secondary' : 'outline'}
        href={`/${slug}/search`}
        icon={
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        }
      />
    </div>
  );
}
