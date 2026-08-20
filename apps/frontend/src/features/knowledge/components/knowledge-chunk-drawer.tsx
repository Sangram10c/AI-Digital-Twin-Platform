'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CodeBlock } from '@/components/shared/code-block';
import { KnowledgeDocument, KnowledgeChunk } from '../types/knowledge.types';

interface KnowledgeChunkDrawerProps {
  document: KnowledgeDocument | null;
  chunks: KnowledgeChunk[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KnowledgeChunkDrawer({
  document,
  chunks,
  open,
  onOpenChange,
}: KnowledgeChunkDrawerProps) {
  if (!document) return null;

  const docChunks = chunks.filter((c) => c.documentId === document.id || !c.documentId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border border-slate-800/90 bg-[#0b101f] shadow-2xl rounded-2xl max-w-3xl p-6">
        <DialogHeader className="border-b border-slate-800 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-bold text-white font-mono truncate max-w-lg">
              {document.title || document.filePath || 'Document Chunks'}
            </DialogTitle>
            <Badge variant="secondary" size="sm">
              {document.chunkCount || docChunks.length} Chunks
            </Badge>
          </div>
          <DialogDescription className="text-xs text-slate-400 font-mono pt-1">
            {document.filePath ? `Path: ${document.filePath}` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3 max-h-[500px] overflow-y-auto pr-1">
          {docChunks.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 rounded-xl border border-dashed border-slate-800 bg-slate-900/30">
              No individual chunks loaded for this document. Chunks are generated dynamically during
              AST indexing.
            </div>
          ) : (
            docChunks.map((chunk, idx) => (
              <div
                key={chunk.id || idx}
                className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white font-mono">
                    Chunk #{chunk.chunkIndex ?? idx + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      size="sm"
                      className="font-mono text-[9px] text-slate-400"
                    >
                      {chunk.tokenCount || 120} Tokens
                    </Badge>
                    <Badge variant="ai" size="sm" dot className="font-mono text-[9px]">
                      Embedded
                    </Badge>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-950 overflow-hidden text-xs">
                  <CodeBlock
                    code={chunk.content}
                    language={
                      document.filePath?.endsWith('.ts') || document.filePath?.endsWith('.tsx')
                        ? 'typescript'
                        : 'markdown'
                    }
                    showLineNumbers={false}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
