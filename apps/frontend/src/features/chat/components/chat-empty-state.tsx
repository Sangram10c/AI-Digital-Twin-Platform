'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ChatEmptyStateProps {
  repositoryName?: string | null;
  onSelectPrompt: (prompt: string) => void;
}

const PROMPT_SUGGESTIONS = [
  {
    title: 'Authentication & Security',
    prompt:
      'Explain how JWT authentication and role-based permissions are enforced in the backend.',
    icon: '🔐',
  },
  {
    title: 'Hybrid RAG Architecture',
    prompt: 'How does the 10-step hybrid RAG pipeline retrieve and rank knowledge chunks?',
    icon: '⚡',
  },
  {
    title: 'Background Sync Queues',
    prompt:
      'Where are BullMQ background jobs configured for repository synchronization and checkpoints?',
    icon: '⚙️',
  },
  {
    title: 'Database Schema & Relations',
    prompt:
      'Summarize the primary Prisma schema models, indexes, and workspace isolation boundaries.',
    icon: '🗄️',
  },
];

export function ChatEmptyState({ repositoryName, onSelectPrompt }: ChatEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 max-w-2xl mx-auto text-center space-y-6 animate-in fade-in-50 duration-300">
      {/* Brand Icon & Welcome */}
      <div className="flex flex-col items-center space-y-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/10 border border-blue-500/30 text-2xl shadow-inner">
          🤖
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-lg font-bold text-white">AI Engineering Digital Twin</h2>
            <Badge variant="ai" size="sm">
              Grounded RAG
            </Badge>
          </div>
          <p className="text-xs text-slate-400 max-w-md">
            Grounded in your indexed codebase, commits, PR discussions, and architecture docs for{' '}
            <span className="font-semibold text-blue-400 font-mono">
              {repositoryName || 'connected repositories'}
            </span>
            .
          </p>
        </div>
      </div>

      {/* Suggested Prompts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
        {PROMPT_SUGGESTIONS.map((item, idx) => (
          <Card
            key={idx}
            onClick={() => onSelectPrompt(item.prompt)}
            className="p-3.5 border-slate-800 bg-[#0b101f]/70 hover:bg-[#0b101f] hover:border-blue-500/50 transition-all cursor-pointer rounded-xl group"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-sm">{item.icon}</span>
              <span className="text-xs font-semibold text-white group-hover:text-blue-400 transition-colors">
                {item.title}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
              &ldquo;{item.prompt}&rdquo;
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
