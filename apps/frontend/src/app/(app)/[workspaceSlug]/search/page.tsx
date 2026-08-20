'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWorkspaceStore } from '@/store/workspace.store';
import { searchService } from '@/services/search.service';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

export default function SearchPage() {
  const params = useParams();
  const slug = (params?.workspaceSlug as string) || 'default';
  const { currentWorkspace, workspaces } = useWorkspaceStore();

  const activeWorkspace = currentWorkspace ||
    workspaces.find((w) => w.slug === slug) || {
      id: 'default',
      name: slug,
      slug,
    };

  const workspaceId = activeWorkspace.id;

  const [inputVal, setInputVal] = React.useState('');
  const [activeQuery, setActiveQuery] = React.useState('');
  const [searchMode, setSearchMode] = React.useState('hybrid');

  const {
    data: searchResponse,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['workspace', workspaceId, 'search', activeQuery, searchMode],
    queryFn: () =>
      searchService.search({
        workspaceId,
        query: activeQuery,
        limit: 20,
      }),
    enabled: Boolean(workspaceId && workspaceId !== 'default' && activeQuery.trim()),
  });

  const results = searchResponse?.results || [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) {
      setActiveQuery(inputVal.trim());
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1 border-b border-slate-800 pb-5">
        <h1 className="text-xl font-bold text-white sm:text-2xl">Hybrid Code & History Search</h1>
        <p className="text-xs text-slate-400">
          Combines vector semantic embeddings with PostgreSQL full-text search and RRF ranking.
        </p>
      </div>

      {/* Search Input Form */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search functions, architecture, commit diffs, or pull requests..."
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          className="flex-1 bg-slate-900/80 border-slate-800 text-white text-xs"
          leftIcon={
            <svg
              className="h-4 w-4 text-slate-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          }
        />
        <Tabs value={searchMode} onValueChange={setSearchMode} className="w-auto">
          <TabsList className="bg-slate-900 border border-slate-800">
            <TabsTrigger value="hybrid">Hybrid</TabsTrigger>
            <TabsTrigger value="vector">Vector</TabsTrigger>
            <TabsTrigger value="keyword">Keyword</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button type="submit" variant="ai" disabled={!inputVal.trim() || isFetching}>
          {isFetching ? 'Searching...' : 'Search'}
        </Button>
      </form>

      {/* Search Results Area */}
      <div className="space-y-3 pt-2">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-3">
            <LoadingSpinner size="lg" />
            <span className="text-xs text-slate-400 font-mono">
              Executing hybrid vector search...
            </span>
          </div>
        ) : !activeQuery ? (
          <Card className="border border-slate-800 bg-[#0b101f] p-12 text-center rounded-2xl shadow-xl space-y-2">
            <span className="text-3xl">🔍</span>
            <h3 className="text-sm font-semibold text-white">Enter a search query</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Search across synchronized codebases, commits, architectural decisions, and pull
              requests.
            </p>
          </Card>
        ) : results.length === 0 ? (
          <Card className="border border-slate-800 bg-[#0b101f] p-12 text-center rounded-2xl shadow-xl space-y-2">
            <span className="text-3xl">📭</span>
            <h3 className="text-sm font-semibold text-white">
              No results found for &ldquo;{activeQuery}&rdquo;
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try adjusting your query terms, checking repository sync status, or switching search
              modes.
            </p>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Top Results ({results.length})</span>
              {searchResponse?.executionTimeMs && (
                <span>Retrieved in {searchResponse.executionTimeMs}ms</span>
              )}
            </div>

            {results.map((res, i) => (
              <Card
                key={i}
                interactive
                className="p-4 space-y-2 border-slate-800 bg-[#0b101f] hover:border-blue-500/50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge size="sm" variant="secondary" className="font-mono text-[9px]">
                      {res.type}
                    </Badge>
                    <CardTitle className="text-sm text-white font-mono">{res.title}</CardTitle>
                  </div>
                  <span className="text-[11px] font-mono text-blue-400 font-semibold">
                    Score: {typeof res.score === 'number' ? res.score.toFixed(3) : res.score}
                  </span>
                </div>
                {res.path && (
                  <p className="text-xs font-mono text-slate-400 truncate">{res.path}</p>
                )}
                {res.snippet && (
                  <p className="rounded-xl bg-[#050811] p-3 font-mono text-[11px] text-slate-200 leading-relaxed border border-slate-800/80">
                    {res.snippet}
                  </p>
                )}
              </Card>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
