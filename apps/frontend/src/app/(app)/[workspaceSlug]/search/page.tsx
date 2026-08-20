'use client';

import * as React from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useWorkspaceStore } from '@/store/workspace.store';
import { searchService } from '@/services/search.service';
import { repositoryService } from '@/services/repository.service';
import {
  SearchInput,
  SearchToolbar,
  SearchResultCard,
  SourceViewer,
  SearchEmptyState,
  SearchSkeleton,
  SearchMode,
} from '@/features/search';
import { ErrorState } from '@/components/shared/error-state';

export default function SearchPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const slug = (params?.workspaceSlug as string) || 'default';
  const initialQuery = searchParams.get('q') || '';
  const initialMode = (searchParams.get('mode') as SearchMode) || 'hybrid';
  const initialRepoId = searchParams.get('repositoryId') || 'ALL';

  const { currentWorkspace, workspaces } = useWorkspaceStore();

  const activeWorkspace = currentWorkspace ||
    workspaces.find((w) => w.slug === slug) || {
      id: 'default',
      name: slug,
      slug,
    };

  const workspaceId = activeWorkspace.id;

  const [inputVal, setInputVal] = React.useState(initialQuery);
  const [activeQuery, setActiveQuery] = React.useState(initialQuery);
  const [searchMode, setSearchMode] = React.useState<SearchMode>(initialMode);
  const [selectedRepoId, setSelectedRepoId] = React.useState<string>(initialRepoId);
  const [selectedChunkId, setSelectedChunkId] = React.useState<string | null>(null);

  // Sync state to URL
  const updateUrl = (query: string, mode: SearchMode, repoId: string) => {
    const p = new URLSearchParams();
    if (query) p.set('q', query);
    if (mode && mode !== 'hybrid') p.set('mode', mode);
    if (repoId && repoId !== 'ALL') p.set('repositoryId', repoId);

    const qs = p.toString();
    router.replace(`/${slug}/search${qs ? `?${qs}` : ''}`);
  };

  // Fetch connected repositories for repository filter
  const { data: repositories = [] } = useQuery({
    queryKey: ['workspace', workspaceId, 'repositories'],
    queryFn: () => repositoryService.getRepositories(workspaceId),
    enabled: Boolean(workspaceId && workspaceId !== 'default'),
  });

  // Execute Search query
  const {
    data: searchResponse,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['workspace', workspaceId, 'search', activeQuery, searchMode, selectedRepoId],
    queryFn: () =>
      searchService.search({
        workspaceId,
        query: activeQuery,
        mode: searchMode,
        repositoryIds: selectedRepoId !== 'ALL' ? [selectedRepoId] : undefined,
        pageSize: 25,
      }),
    enabled: Boolean(workspaceId && workspaceId !== 'default' && activeQuery.trim()),
  });

  const results = React.useMemo(() => searchResponse?.results || [], [searchResponse]);

  // Derived selected hit without effect
  const selectedHit = React.useMemo(() => {
    if (selectedChunkId) {
      return results.find((r) => r.chunkId === selectedChunkId) || results[0] || null;
    }
    return results[0] || null;
  }, [results, selectedChunkId]);

  const handleSearchSubmit = (q: string) => {
    setActiveQuery(q);
    setSelectedChunkId(null);
    updateUrl(q, searchMode, selectedRepoId);
  };

  const handleModeChange = (mode: SearchMode) => {
    setSearchMode(mode);
    if (activeQuery) {
      updateUrl(activeQuery, mode, selectedRepoId);
    }
  };

  const handleRepoChange = (repoId: string) => {
    setSelectedRepoId(repoId);
    if (activeQuery) {
      updateUrl(activeQuery, searchMode, repoId);
    }
  };

  const handleClear = () => {
    setInputVal('');
    setActiveQuery('');
    setSelectedChunkId(null);
    updateUrl('', searchMode, selectedRepoId);
  };

  return (
    <div className="space-y-6 max-w-7xl pb-16">
      {/* Header */}
      <div className="space-y-1 pb-4 border-b border-slate-800/80">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Hybrid Code & Document Search
        </h1>
        <p className="text-xs text-slate-400">
          Combines dense vector embeddings (pgvector) with PostgreSQL full-text search and RRF
          reciprocal rank fusion.
        </p>
      </div>

      {/* Search Input Bar */}
      <SearchInput
        value={inputVal}
        onChange={setInputVal}
        onSubmit={handleSearchSubmit}
        isSearching={isFetching}
        onClear={handleClear}
      />

      {/* Toolbar with Mode & Repository Scope */}
      <SearchToolbar
        mode={searchMode}
        onModeChange={handleModeChange}
        selectedRepoId={selectedRepoId}
        onRepoChange={handleRepoChange}
        repositories={repositories}
        totalResults={searchResponse?.pagination.total}
        executionTimeMs={searchResponse?.timing?.totalMs}
      />

      {/* Content Area */}
      {isLoading && isFetching ? (
        <SearchSkeleton />
      ) : isError ? (
        <ErrorState
          title="Search Failed"
          description="Failed to retrieve search results from hybrid retriever. Please retry."
          onRetry={() => refetch()}
        />
      ) : !activeQuery ? (
        <SearchEmptyState
          onSelectSuggestion={(s) => {
            setInputVal(s);
            handleSearchSubmit(s);
          }}
        />
      ) : results.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-slate-800 bg-[#0b101f] space-y-2">
          <div className="text-2xl">🔎</div>
          <div className="text-sm font-semibold text-white">
            No results found for &quot;{activeQuery}&quot;
          </div>
          <p className="text-xs text-slate-400">
            Try adjusting your search terms, changing the search mode, or clearing repository
            filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left Column: Result Cards */}
          <div className="space-y-3 max-h-[660px] overflow-y-auto pr-1">
            {results.map((hit) => (
              <SearchResultCard
                key={hit.chunkId}
                hit={hit}
                isSelected={selectedHit?.chunkId === hit.chunkId}
                onSelect={() => setSelectedChunkId(hit.chunkId)}
              />
            ))}
          </div>

          {/* Right Column: Source Viewer */}
          <div className="sticky top-4">
            <SourceViewer hit={selectedHit} slug={slug} onClose={() => setSelectedChunkId(null)} />
          </div>
        </div>
      )}
    </div>
  );
}
