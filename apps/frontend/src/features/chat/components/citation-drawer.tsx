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
import type { Citation } from '@/types/chat.types';

interface CitationDrawerProps {
  citation: Citation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CitationDrawer({ citation, open, onOpenChange }: CitationDrawerProps) {
  if (!citation) return null;

  const matchPercent = (citation.relevanceScore * 100).toFixed(0);
  const fileTitle = citation.filePath || citation.title || 'Referenced Source';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border border-slate-800/90 bg-[#0b101f] shadow-2xl rounded-2xl max-w-2xl p-6">
        <DialogHeader className="border-b border-slate-800 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-500/20 text-xs font-bold text-blue-400">
                {citation.index}
              </span>
              <DialogTitle className="text-base font-bold text-white font-mono truncate max-w-md">
                {fileTitle}
              </DialogTitle>
            </div>
            <Badge variant="ai" size="sm">
              {matchPercent}% Relevance
            </Badge>
          </div>

          <DialogDescription className="text-xs text-slate-400 font-mono pt-1">
            {citation.repositoryName ? `Repository: ${citation.repositoryName} • ` : ''}
            Chunk ID: {citation.knowledgeChunkId.slice(0, 16)}...
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-2.5">
              <span className="text-[10px] text-slate-400 uppercase font-mono">Source Type</span>
              <p className="font-semibold text-white mt-0.5">Codebase Knowledge</p>
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-2.5">
              <span className="text-[10px] text-slate-400 uppercase font-mono">Confidence</span>
              <p className="font-semibold text-emerald-400 mt-0.5">{matchPercent}% Match</p>
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-2.5 col-span-2 sm:col-span-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono">
                Source Repository
              </span>
              <p className="font-semibold text-blue-400 mt-0.5 truncate">
                {citation.repositoryName || 'Primary Workspace'}
              </p>
            </div>
          </div>

          {/* Code Excerpt Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-semibold">Grounding Excerpt</span>
              {citation.filePath && (
                <span className="text-[10px] text-slate-400 font-mono">{citation.filePath}</span>
              )}
            </div>
            <div className="rounded-xl border border-slate-800 bg-[#050811] overflow-hidden">
              <CodeBlock
                code={citation.excerpt || '// No preview available for this chunk.'}
                language={
                  citation.filePath?.endsWith('.ts') || citation.filePath?.endsWith('.tsx')
                    ? 'typescript'
                    : 'javascript'
                }
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
