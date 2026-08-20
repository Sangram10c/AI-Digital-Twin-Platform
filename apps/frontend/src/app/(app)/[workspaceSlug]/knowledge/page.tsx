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

  // Real knowledge documents
  const {
    data: documents = [],
    isLoading: isDocsLoading,
    isError: isDocsError,
    refetch: refetchDocs,
  } = useQuery({
    queryKey: ['workspace', workspaceId, 'knowledge', 'documents'],
    queryFn: () => knowledgeService.listDocuments(workspaceId),
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
    queryKey: ['workspace', workspaceId, 'knowledge', 'chunks'],
    queryFn: () => knowledgeService.listChunks(workspaceId),
    enabled: Boolean(workspaceId && workspaceId !== 'default' && isChunkDrawerOpen),
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
          <div className="flex justify-center text-4xl">📚</div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No knowledge documents indexed yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Documents and AST code chunks will appear automatically once your connected
              repositories complete their synchronization pipeline.
            </p>
          </div>
        </Card>
      ) : (
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
                    <div className="truncate max-w-xs sm:max-w-md">{src.title || src.filePath}</div>
                    {src.filePath && (
                      <div className="text-[10px] text-slate-400 font-mono truncate max-w-xs sm:max-w-md">
                        {src.filePath}
                      </div>
                    )}
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
