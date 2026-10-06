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
    icon: (
      <svg
        className="h-4 w-4 text-emerald-400"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  {
    title: 'Hybrid RAG Architecture',
    prompt: 'How does the 10-step hybrid RAG pipeline retrieve and rank knowledge chunks?',
    icon: (
      <svg
        className="h-4 w-4 text-amber-400"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    title: 'Background Sync Queues',
    prompt:
      'Where are BullMQ background jobs configured for repository synchronization and checkpoints?',
    icon: (
      <svg
        className="h-4 w-4 text-cyan-400"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    title: 'Database Schema & Relations',
    prompt:
      'Summarize the primary Prisma schema models, indexes, and workspace isolation boundaries.',
    icon: (
      <svg
        className="h-4 w-4 text-purple-400"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </svg>
    ),
  },
];

export function ChatEmptyState({ repositoryName, onSelectPrompt }: ChatEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 max-w-2xl mx-auto text-center space-y-6 animate-in fade-in-50 duration-300">
      {/* Brand Icon & Welcome */}
      <div className="flex flex-col items-center space-y-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/10 border border-blue-500/30 text-blue-400 shadow-inner">
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
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
              <span className="shrink-0">{item.icon}</span>
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
