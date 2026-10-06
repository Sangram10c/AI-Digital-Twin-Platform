'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { SearchHistoryItem } from '@/services/search.service';

interface SearchEmptyStateProps {
  onSelectSuggestion: (query: string, mode?: string) => void;
  searchHistory?: SearchHistoryItem[];
  isLoadingHistory?: boolean;
}

function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function renderModeBadge(type?: string) {
  const norm = (type || 'hybrid').toUpperCase();
  if (norm === 'SEMANTIC' || norm === 'VECTOR') {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-blue-950/70 text-blue-300 border border-blue-800/40">
        Semantic
      </span>
    );
  }
  if (norm === 'KEYWORD') {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-950/70 text-emerald-300 border border-emerald-800/40">
        Keyword
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-purple-950/70 text-purple-300 border border-purple-800/40">
      Hybrid
    </span>
  );
}

export function SearchEmptyState({
  onSelectSuggestion,
  searchHistory = [],
  isLoadingHistory = false,
}: SearchEmptyStateProps) {
  const suggestions = [
    'How does authentication work?',
    'Find JWT token refresh handling',
    'Repository synchronization queue',
    'RRF hybrid search algorithm',
  ];

  return (
    <div className="space-y-6">
      {/* 1. Hero Prompt Card */}
      <Card className="p-8 rounded-2xl border border-slate-800/80 bg-[#0b101f] text-center space-y-4 shadow-xl">
        <div className="space-y-2 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-blue-400 shadow-inner">
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <circle cx="11" cy="11" r="8" />
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.3-4.3" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-white tracking-tight">
            Search Codebase Knowledge
          </h3>
          <p className="text-xs text-slate-400">
            Query indexed files, commit diffs, functions, and documentation across your workspace.
          </p>
        </div>

        {/* Suggested Quick Prompts */}
        <div className="pt-2 flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => onSelectSuggestion(s, 'hybrid')}
              className="text-xs px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700 hover:text-white hover:bg-slate-800/80 transition-all font-mono shadow-sm"
            >
              {s}
            </button>
          ))}
        </div>
      </Card>

      {/* 2. Recent Queries Section (Shows the 16+ past searches) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="text-xs font-semibold text-slate-300 tracking-wide uppercase">
              Recent Search Queries
            </h2>
          </div>
          {searchHistory.length > 0 && (
            <Badge variant="secondary" size="sm" className="font-mono text-[10px] text-slate-400">
              {searchHistory.length} recorded
            </Badge>
          )}
        </div>

        {isLoadingHistory ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-16 rounded-xl border border-slate-800/60 bg-slate-900/30 animate-pulse"
              />
            ))}
          </div>
        ) : searchHistory.length === 0 ? (
          <div className="p-6 text-center rounded-xl border border-dashed border-slate-800 bg-[#0b101f]/40 text-xs text-slate-500 font-mono">
            No previous search queries logged for this workspace yet. Execute a search above to
            build history.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {searchHistory.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectSuggestion(item.query, item.searchType?.toLowerCase())}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onSelectSuggestion(item.query, item.searchType?.toLowerCase());
                  }
                }}
                className="group flex flex-col justify-between p-3.5 rounded-xl border border-slate-800/80 bg-[#0b101f] hover:bg-slate-900/80 hover:border-slate-700/80 transition-all cursor-pointer text-left shadow-sm space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <svg
                      className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 shrink-0 transition-colors"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.3-4.3" />
                    </svg>
                    <span className="font-mono text-xs font-semibold text-slate-200 group-hover:text-white transition-colors truncate">
                      {item.query}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono shrink-0">
                    {formatRelativeTime(item.createdAt)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                  <div className="flex items-center gap-2">
                    {renderModeBadge(item.searchType)}
                    <span className="font-mono text-[10px] text-slate-400">
                      {item.resultCount} {item.resultCount === 1 ? 'result' : 'results'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 group-hover:text-blue-400 font-mono flex items-center gap-1 transition-colors">
                    Re-run
                    <svg
                      className="w-3 h-3 group-hover:translate-x-0.5 transition-transform"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                      />
                    </svg>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
