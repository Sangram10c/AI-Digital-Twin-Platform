'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
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
import { LoadingSpinner } from '@/components/shared/loading-spinner';

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

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['workspace', workspaceId, 'knowledge', 'documents'],
    queryFn: () => knowledgeService.listDocuments(workspaceId),
    enabled: Boolean(workspaceId && workspaceId !== 'default'),
  });

  const { data: statistics } = useQuery({
    queryKey: ['workspace', workspaceId, 'knowledge', 'statistics'],
    queryFn: () => knowledgeService.getStatistics(workspaceId),
    enabled: Boolean(workspaceId && workspaceId !== 'default'),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">Knowledge Base</h1>
          <p className="text-xs text-slate-400">
            Normalized documentation, source-code symbols, and pgvector embeddings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {statistics && (
            <Badge variant="secondary" size="sm" className="font-mono text-[10px]">
              {statistics.totalChunks} Chunks • {statistics.totalDocuments} Docs
            </Badge>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 space-y-3">
          <LoadingSpinner size="lg" />
          <span className="text-xs text-slate-400 font-mono">Loading knowledge documents...</span>
        </div>
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
                <TableHead className="text-right text-slate-400">Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((src) => (
                <TableRow
                  key={src.id || src.filePath}
                  className="border-b border-slate-800/60 hover:bg-slate-900/40"
                >
                  <TableCell className="font-semibold text-white">
                    <div>{src.title || src.filePath}</div>
                    {src.filePath && (
                      <div className="text-[10px] text-slate-400 font-mono truncate max-w-xs sm:max-w-md">
                        {src.filePath}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge size="sm" variant="secondary" className="font-mono text-[9px]">
                      {src.documentType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-300 font-mono">
                    {src.chunkCount}
                  </TableCell>
                  <TableCell>
                    <Badge size="sm" variant={src.isEmbedded ? 'success' : 'secondary'} dot>
                      {src.isEmbedded ? '100% Embedded' : 'Processing'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-slate-400 text-xs font-mono">
                    {new Date(src.updatedAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
