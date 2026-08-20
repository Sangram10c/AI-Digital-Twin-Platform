'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SearchMode } from '../types/search.types';
import { Repository } from '@/services/repository.service';

interface SearchToolbarProps {
  mode: SearchMode;
  onModeChange: (mode: SearchMode) => void;
  selectedRepoId: string;
  onRepoChange: (repoId: string) => void;
  repositories: Repository[];
  totalResults?: number;
  executionTimeMs?: number;
}

export function SearchToolbar({
  mode,
  onModeChange,
  selectedRepoId,
  onRepoChange,
  repositories,
  totalResults,
  executionTimeMs,
}: SearchToolbarProps) {
  const repoOptions = [
    { value: 'ALL', label: 'All Repositories' },
    ...repositories.map((r) => ({
      value: r.id,
      label: r.name,
    })),
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Mode Switcher */}
        <Tabs value={mode} onValueChange={(val) => onModeChange(val as SearchMode)}>
          <TabsList className="bg-slate-900 border border-slate-800 h-8 p-0.5 rounded-lg">
            <TabsTrigger value="hybrid" className="text-xs px-3 h-7">
              Hybrid (Vector + Fulltext)
            </TabsTrigger>
            <TabsTrigger value="vector" className="text-xs px-3 h-7">
              Semantic Vector
            </TabsTrigger>
            <TabsTrigger value="keyword" className="text-xs px-3 h-7">
              Keyword (BM25)
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Repository Scope Selector */}
        {repositories.length > 0 && (
          <div className="w-48">
            <Select
              value={selectedRepoId}
              onChange={(e) => onRepoChange(e.target.value)}
              options={repoOptions}
              className="h-8 text-xs bg-slate-900 border-slate-800"
            />
          </div>
        )}
      </div>

      {totalResults !== undefined && totalResults > 0 && (
        <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
          <Badge variant="outline" size="sm" className="font-mono text-[10px]">
            {totalResults} {totalResults === 1 ? 'Match' : 'Matches'}
          </Badge>
          {executionTimeMs !== undefined && <span>• {executionTimeMs}ms</span>}
        </div>
      )}
    </div>
  );
}
