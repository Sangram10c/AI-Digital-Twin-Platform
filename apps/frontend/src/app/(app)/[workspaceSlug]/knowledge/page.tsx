'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { useWorkspaceStore } from '@/store/workspace.store';
import { knowledgeService } from '@/services/knowledge.service';
import {
  KnowledgeMetrics,
  KnowledgeChunkDrawer,
  KnowledgeSkeleton,
  KnowledgeDocument,
} from '@/features/knowledge';
import { ErrorState } from '@/components/shared/error-state';

export default function KnowledgePage() {
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

  const [searchFilter, setSearchFilter] = React.useState('');
  const [selectedDoc, setSelectedDoc] = React.useState<KnowledgeDocument | null>(null);
  const [isChunkDrawerOpen, setIsChunkDrawerOpen] = React.useState(false);

  const [page, setPage] = React.useState(1);
  const limit = 50;

  // Real knowledge documents
  const {
    data: documents = [],
    isLoading: isDocsLoading,
    isError: isDocsError,
    refetch: refetchDocs,
  } = useQuery({
    queryKey: ['workspace', workspaceId, 'knowledge', 'documents', page],
    queryFn: () => knowledgeService.listDocuments(workspaceId, page, limit),
    enabled: Boolean(workspaceId && workspaceId !== 'default'),
  });

  // Real knowledge statistics
  const { data: statistics } = useQuery({
    queryKey: ['workspace', workspaceId, 'knowledge', 'statistics'],
    queryFn: () => knowledgeService.getStatistics(workspaceId),
    enabled: Boolean(workspaceId && workspaceId !== 'default'),
  });

  // Real knowledge chunks for selected doc
  const { data: chunks = [] } = useQuery({
    queryKey: ['workspace', workspaceId, 'knowledge', 'chunks', selectedDoc?.id],
    queryFn: () => knowledgeService.listChunks(workspaceId, 1, 50, selectedDoc?.id),
    enabled: Boolean(
      workspaceId && workspaceId !== 'default' && isChunkDrawerOpen && selectedDoc?.id,
    ),
  });

  const filteredDocs = React.useMemo(() => {
    if (!searchFilter.trim()) return documents;
    const q = searchFilter.toLowerCase();
    return documents.filter(
      (d) =>
        d.title?.toLowerCase().includes(q) ||
        d.filePath?.toLowerCase().includes(q) ||
        d.repositoryName?.toLowerCase().includes(q) ||
        d.documentType?.toLowerCase().includes(q),
    );
  }, [documents, searchFilter]);

  const handleInspectDoc = (doc: KnowledgeDocument) => {
    setSelectedDoc(doc);
    setIsChunkDrawerOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl pb-16">
      {/* 1. Header */}
      <div className="space-y-1 pb-4 border-b border-slate-800/80">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Codebase Knowledge & Embeddings
        </h1>
        <p className="text-xs text-slate-400">
          AST heuristics, normalized documentation files, and 768-dimensional pgvector embeddings.
        </p>
      </div>

      {/* 2. Key Metrics Overview */}
      <KnowledgeMetrics statistics={statistics} />

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Input
            placeholder="Search documents, symbols, or files..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="bg-slate-900 border-slate-800 text-xs h-9 pl-9 rounded-xl text-white"
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
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Showing {filteredDocs.length} of {documents.length} sources
        </span>
      </div>

      {/* 4. Table / Content */}
      {isDocsLoading ? (
        <KnowledgeSkeleton />
      ) : isDocsError ? (
        <ErrorState
          title="Failed to Load Knowledge"
          description="Unable to fetch indexed documentation and vector chunks from workspace."
          onRetry={refetchDocs}
        />
      ) : documents.length === 0 ? (
        <Card className="border border-slate-800 bg-[#0b101f] p-12 text-center rounded-2xl shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
              />
            </svg>
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No knowledge documents indexed yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Documents and AST code chunks will appear automatically once your connected
              repositories complete their synchronization pipeline.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-[#0b101f] overflow-hidden shadow-xl">
            <Table>
              <TableHeader className="bg-slate-900/60 border-b border-slate-800">
                <TableRow>
                  <TableHead className="text-slate-400">Source Document</TableHead>
                  <TableHead className="text-slate-400">Type</TableHead>
                  <TableHead className="text-slate-400">Chunks</TableHead>
                  <TableHead className="text-slate-400">Embedding Status</TableHead>
                  <TableHead className="text-right text-slate-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocs.map((src) => (
                  <TableRow
                    key={src.id || src.filePath}
                    className="border-b border-slate-800/60 hover:bg-slate-900/40"
                  >
                    <TableCell className="font-semibold text-white">
                      <div className="truncate max-w-xs sm:max-w-md">
                        {src.title || src.filePath}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono truncate max-w-xs sm:max-w-md pt-0.5">
                        {src.repositoryName && (
                          <span className="text-blue-400 font-medium">{src.repositoryName}</span>
                        )}
                        {src.repositoryName && src.filePath && <span>•</span>}
                        {src.filePath && <span className="truncate">{src.filePath}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" size="sm" className="font-mono text-[9px]">
                        {src.documentType || 'CODE_SYMBOL'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-300">
                      {src.chunkCount} chunks
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={src.isEmbedded ? 'ai' : 'outline'}
                        size="sm"
                        dot
                        className="font-mono text-[9px]"
                      >
                        {src.isEmbedded ? 'Embedded' : 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleInspectDoc(src)}
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        Inspect Chunks →
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination controls */}
          {((statistics?.totalDocuments || 0) > limit || page > 1) && (
            <div className="flex items-center justify-between text-xs text-slate-400 px-2 py-1">
              <span>
                Page {page} of{' '}
                {Math.max(1, Math.ceil((statistics?.totalDocuments || documents.length) / limit))}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8 text-xs border-slate-800 bg-slate-900 text-slate-300 hover:text-white"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    page >= Math.ceil((statistics?.totalDocuments || documents.length) / limit)
                  }
                  onClick={() => setPage((p) => p + 1)}
                  className="h-8 text-xs border-slate-800 bg-slate-900 text-slate-300 hover:text-white"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Chunks Inspector Drawer */}
      <KnowledgeChunkDrawer
        document={selectedDoc}
        chunks={chunks}
        open={isChunkDrawerOpen}
        onOpenChange={setIsChunkDrawerOpen}
      />
    </div>
  );
}
