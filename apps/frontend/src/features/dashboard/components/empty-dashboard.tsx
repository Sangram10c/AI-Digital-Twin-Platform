'use client';

import Link from 'next/link';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface EmptyDashboardProps {
  slug: string;
  workspaceName: string;
  isGithubConnected: boolean;
}

export function EmptyDashboard({ slug, workspaceName, isGithubConnected }: EmptyDashboardProps) {
  return (
    <Card className="border border-slate-800 bg-[#0b101f] p-8 sm:p-10 rounded-2xl shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-950/60 border border-blue-500/30 text-blue-400 text-2xl shrink-0">
          ⚡
        </div>
        <div className="space-y-1">
          <CardTitle className="text-lg sm:text-xl font-bold text-white">
            Welcome to {workspaceName}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
            You have not connected a repository to this workspace yet. Link your codebase to
            generate AST syntax trees, vector embeddings, and full AI architecture intelligence.
          </CardDescription>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/40 space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 text-xs font-mono font-bold">
              1
            </span>
            <span className="font-semibold text-xs text-white">Connect Codebase</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {isGithubConnected
              ? 'Your GitHub account is linked. Select repositories to sync.'
              : 'Link your GitHub account or connect a public/private Git repository.'}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/40 space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-600/20 text-purple-400 text-xs font-mono font-bold">
              2
            </span>
            <span className="font-semibold text-xs text-white">Automated Ingestion</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Background BullMQ workers extract code chunks, generate AST graphs, and create pgvector
            embeddings.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/40 space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-600/20 text-emerald-400 text-xs font-mono font-bold">
              3
            </span>
            <span className="font-semibold text-xs text-white">10-Step Grounded RAG</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Ask complex architecture questions with verified line-number citations and hybrid
            search.
          </p>
        </div>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
        <Link href={`/${slug}/repositories`}>
          <Button variant="ai" size="sm" className="text-xs gap-1.5 h-9 px-4">
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Connect First Repository</span>
          </Button>
        </Link>

        <Link href={`/${slug}/settings/integrations`}>
          <Button variant="outline" size="sm" className="text-xs h-9">
            Manage Integrations
          </Button>
        </Link>
      </div>
    </Card>
  );
}
