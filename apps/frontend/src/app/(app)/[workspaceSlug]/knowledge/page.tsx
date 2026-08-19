'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

export default function KnowledgePage() {
  const sources = [
    { title: 'README.md', path: 'README.md', chunks: 8, embedded: '100%', type: 'MARKDOWN' },
    {
      title: 'Architecture Decisions',
      path: 'docs/05-system-architecture/README.md',
      chunks: 14,
      embedded: '100%',
      type: 'ADR',
    },
    {
      title: 'auth.service.ts',
      path: 'apps/backend/src/modules/auth/auth.service.ts',
      chunks: 6,
      embedded: '100%',
      type: 'CODE',
    },
    {
      title: 'hybrid-search.service.ts',
      path: 'apps/backend/src/modules/search/services/hybrid-search.service.ts',
      chunks: 12,
      embedded: '100%',
      type: 'CODE',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">Knowledge Base</h1>
          <p className="text-xs text-muted-foreground">
            Normalized documentation, source-code symbols, and pgvector embeddings.
          </p>
        </div>
        <Button size="sm" variant="default">
          Upload Custom Document
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Source</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Chunks</TableHead>
            <TableHead>Embedding Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sources.map((src) => (
            <TableRow key={src.path}>
              <TableCell className="font-semibold text-foreground">
                <div>{src.title}</div>
                <div className="text-[10px] text-muted-foreground font-mono">{src.path}</div>
              </TableCell>
              <TableCell>
                <Badge size="sm" variant="secondary">
                  {src.type}
                </Badge>
              </TableCell>
              <TableCell>{src.chunks}</TableCell>
              <TableCell>
                <Badge size="sm" variant="success" dot>
                  {src.embedded}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button size="sm" variant="ghost">
                  Inspect Chunks
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
