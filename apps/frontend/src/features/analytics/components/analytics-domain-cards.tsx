'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  RepositoryAnalytics,
  KnowledgeAnalytics,
  SearchAnalytics,
  AiAnalytics,
  ConversationAnalytics,
  JobAnalytics,
} from '@/services/analytics.service';

interface AnalyticsDomainCardsProps {
  repository?: RepositoryAnalytics;
  knowledge?: KnowledgeAnalytics;
  search?: SearchAnalytics;
  ai?: AiAnalytics;
  conversations?: ConversationAnalytics;
  jobs?: JobAnalytics;
}

export function AnalyticsDomainCards({
  repository,
  knowledge,
  search,
  ai,
  conversations,
  jobs,
}: AnalyticsDomainCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* 1. Repository Git Ingestion */}
      <Card className="border border-slate-800 bg-[#0b101f] p-5 rounded-2xl shadow-xl space-y-4">
        <CardHeader className="p-0 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-white">Repository Ingestion</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Git metadata synchronization
            </CardDescription>
          </div>
          <span className="text-lg">🐙</span>
        </CardHeader>

        <CardContent className="p-0 pt-2 space-y-2.5 text-xs font-mono">
          <div className="flex justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-400">Synced Commits</span>
            <span className="text-white font-bold">
              {repository?.totalCommitsSynced ?? repository?.totalCommits ?? 0}
            </span>
          </div>
          <div className="flex justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-400">Pull Requests</span>
            <span className="text-white font-bold">
              {repository?.totalPullRequestsSynced ?? repository?.totalPullRequests ?? 0}
            </span>
          </div>
          <div className="flex justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-400">Sync Success Rate</span>
            <Badge variant="success" size="sm" className="font-mono text-[10px]">
              {repository?.syncSuccessRate ?? 100}%
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* 2. Knowledge & pgvector Chunks */}
      <Card className="border border-slate-800 bg-[#0b101f] p-5 rounded-2xl shadow-xl space-y-4">
        <CardHeader className="p-0 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-white">Knowledge Indexing</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Code chunks & vector embeddings
            </CardDescription>
          </div>
          <span className="text-lg">📚</span>
        </CardHeader>

        <CardContent className="p-0 pt-2 space-y-2.5 text-xs font-mono">
          <div className="flex justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-400">Total Chunks</span>
            <span className="text-white font-bold">
              {knowledge?.totalChunks?.toLocaleString() ?? 0}
            </span>
          </div>
          <div className="flex justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-400">Embedded Chunks</span>
            <span className="text-emerald-400 font-bold">
              {knowledge?.embeddedChunks?.toLocaleString() ?? 0}
            </span>
          </div>
          <div className="flex justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-400">Coverage Rate</span>
            <Badge variant="ai" size="sm" className="font-mono text-[10px]">
              {knowledge?.embeddingCoverageRate ?? 100}%
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* 3. Search Performance */}
      <Card className="border border-slate-800 bg-[#0b101f] p-5 rounded-2xl shadow-xl space-y-4">
        <CardHeader className="p-0 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-white">Hybrid Retrieval</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              BM25 + pgvector RRF ranking
            </CardDescription>
          </div>
          <span className="text-lg">🔍</span>
        </CardHeader>

        <CardContent className="p-0 pt-2 space-y-2.5 text-xs font-mono">
          <div className="flex justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-400">Total Queries</span>
            <span className="text-white font-bold">
              {search?.totalQueries ?? search?.totalSearches ?? 0}
            </span>
          </div>
          <div className="flex justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-400">P95 Latency</span>
            <span className="text-white font-bold">{search?.p95LatencyMs ?? 0}ms</span>
          </div>
          <div className="flex justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-400">Cache Hit Rate</span>
            <span className="text-emerald-400 font-bold">
              {((search?.cacheHitRate ?? 0) * 100).toFixed(0)}%
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 4. AI Inference Breakdown */}
      <Card className="border border-slate-800 bg-[#0b101f] p-5 rounded-2xl shadow-xl space-y-4">
        <CardHeader className="p-0 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-white">AI Inference</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Provider usage & token metrics
            </CardDescription>
          </div>
          <span className="text-lg">🤖</span>
        </CardHeader>

        <CardContent className="p-0 pt-2 space-y-2.5 text-xs font-mono">
          <div className="flex justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-400">Prompt / Output</span>
            <span className="text-white font-bold">
              {(ai?.totalPromptTokens ?? 0).toLocaleString()} /{' '}
              {(ai?.totalCompletionTokens ?? 0).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-400">Avg AI Latency</span>
            <span className="text-white font-bold">{ai?.averageLatencyMs ?? 0}ms</span>
          </div>
          <div className="flex justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-400">Est. Spend</span>
            <span className="text-amber-400 font-bold">
              ${ai?.estimatedCostUsd?.toFixed(4) ?? '0.0000'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 5. Conversation Growth */}
      <Card className="border border-slate-800 bg-[#0b101f] p-5 rounded-2xl shadow-xl space-y-4">
        <CardHeader className="p-0 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-white">RAG Conversations</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Multi-turn chat activity
            </CardDescription>
          </div>
          <span className="text-lg">💬</span>
        </CardHeader>

        <CardContent className="p-0 pt-2 space-y-2.5 text-xs font-mono">
          <div className="flex justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-400">Total Threads</span>
            <span className="text-white font-bold">{conversations?.totalConversations ?? 0}</span>
          </div>
          <div className="flex justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-400">Total Messages</span>
            <span className="text-white font-bold">{conversations?.totalMessages ?? 0}</span>
          </div>
          <div className="flex justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-400">Avg Msgs / Thread</span>
            <span className="text-blue-400 font-bold">
              {conversations?.averageMessagesPerConversation?.toFixed(1) ?? '0.0'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 6. Background Queue Jobs */}
      <Card className="border border-slate-800 bg-[#0b101f] p-5 rounded-2xl shadow-xl space-y-4">
        <CardHeader className="p-0 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-white">BullMQ Jobs</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Asynchronous worker pipelines
            </CardDescription>
          </div>
          <span className="text-lg">⚙️</span>
        </CardHeader>

        <CardContent className="p-0 pt-2 space-y-2.5 text-xs font-mono">
          <div className="flex justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-400">Completed Jobs</span>
            <span className="text-emerald-400 font-bold">{jobs?.completedJobs ?? 0}</span>
          </div>
          <div className="flex justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-400">Failed / Pending</span>
            <span className="text-rose-400 font-bold">
              {jobs?.failedJobs ?? 0} / {jobs?.pendingJobs ?? 0}
            </span>
          </div>
          <div className="flex justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-400">Avg Job Duration</span>
            <span className="text-white font-bold">{jobs?.averageJobDurationMs ?? 0}ms</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
