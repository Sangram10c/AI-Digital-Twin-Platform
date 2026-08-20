'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CodeBlock } from '@/components/shared/code-block';
import { RankedSearchHit } from '../types/search.types';

interface SourceViewerProps {
  hit: RankedSearchHit | null;
  slug: string;
  onClose?: () => void;
}

export function SourceViewer({ hit, slug, onClose }: SourceViewerProps) {
  const [copied, setCopied] = React.useState(false);

  if (!hit) {
    return (
      <Card className="h-full border border-slate-800 bg-[#0b101f] p-8 rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
        <div className="text-3xl">🔍</div>
        <CardTitle className="text-sm font-semibold text-white">Select a Search Result</CardTitle>
        <p className="text-xs text-slate-400 max-w-xs">
          Click any matched code snippet or documentation chunk on the left to inspect its complete
          source context.
        </p>
      </Card>
    );
  }

  const language =
    (hit.metadata?.language as string) ||
    (hit.filePath?.endsWith('.ts') || hit.filePath?.endsWith('.tsx') ? 'typescript' : 'javascript');
  const lineRange = hit.metadata?.startLine
    ? `Lines ${hit.metadata.startLine}–${hit.metadata.endLine || hit.metadata.startLine}`
    : null;

  const handleCopy = () => {
    navigator.clipboard.writeText(hit.preview);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border border-slate-800 bg-[#0b101f] rounded-2xl shadow-xl flex flex-col overflow-hidden h-full">
      {/* Header */}
      <CardHeader className="p-4 border-b border-slate-800 flex flex-row items-center justify-between gap-3 bg-slate-900/60">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-xs text-white truncate">
              {hit.filePath || hit.knowledgeType || 'Source Preview'}
            </span>
            {hit.repositoryName && (
              <Badge variant="secondary" size="sm" className="font-mono text-[9px]">
                {hit.repositoryName}
              </Badge>
            )}
            {lineRange && (
              <Badge variant="outline" size="sm" className="font-mono text-[9px] text-slate-400">
                {lineRange}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="text-xs h-7 px-2 text-slate-400 hover:text-white"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </Button>

          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs h-7 px-2 text-slate-400 hover:text-white"
            >
              ✕
            </Button>
          )}
        </div>
      </CardHeader>

      {/* Code Viewer Body */}
      <CardContent className="p-4 space-y-4 overflow-y-auto max-h-[580px]">
        <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
          <CodeBlock
            code={hit.preview}
            language={language}
            filename={hit.filePath || undefined}
            showLineNumbers={true}
          />
        </div>

        {/* Source Citation & Actions */}
        <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/40 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white">RAG Citation Reference</span>
            <Badge variant="ai" size="sm" className="font-mono text-[9px]">
              Grounding Verified
            </Badge>
          </div>

          <div className="text-[11px] font-mono text-slate-400 space-y-1">
            <div>Chunk ID: {hit.chunkId}</div>
            {hit.repositoryId && <div>Repository ID: {hit.repositoryId}</div>}
          </div>

          <div className="pt-1 flex gap-2">
            <Link href={`/${slug}/chat?repositoryId=${hit.repositoryId || ''}`} className="w-full">
              <Button variant="ai" size="sm" className="w-full text-xs gap-1.5 h-8">
                <span>💬</span>
                <span>Ask AI About This Match</span>
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
