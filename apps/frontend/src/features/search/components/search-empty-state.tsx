'use client';

import { Card } from '@/components/ui/card';

interface SearchEmptyStateProps {
  onSelectSuggestion: (query: string) => void;
}

export function SearchEmptyState({ onSelectSuggestion }: SearchEmptyStateProps) {
  const suggestions = [
    'How does authentication work?',
    'Find JWT token refresh handling',
    'Repository synchronization queue',
    'RRF hybrid search algorithm',
  ];

  return (
    <Card className="p-8 rounded-2xl border border-dashed border-slate-800 bg-[#0b101f]/60 text-center space-y-4">
      <div className="space-y-1.5 max-w-md mx-auto">
        <div className="text-3xl">⚡</div>
        <h3 className="text-sm font-bold text-white">Search Codebase Knowledge</h3>
        <p className="text-xs text-slate-400">
          Query indexed files, commit diffs, functions, and documentation across your workspace.
        </p>
      </div>

      <div className="pt-2 flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => onSelectSuggestion(s)}
            className="text-xs px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700 hover:text-white transition-colors font-mono"
          >
            {s}
          </button>
        ))}
      </div>
    </Card>
  );
}
