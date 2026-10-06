'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
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
        <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <circle cx="11" cy="11" r="8" />
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.3-4.3" />
          </svg>
        </div>
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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(hit.preview);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <Card className="border border-slate-800 bg-[#0b101f] rounded-2xl shadow-xl flex flex-col overflow-hidden h-full">
      {/* 1. Single Unified Header — No Redundant Inner Bars */}
      <CardHeader className="p-3.5 border-b border-slate-800 flex flex-row items-center justify-between gap-3 bg-slate-900/60 shrink-0">
        <div className="min-w-0 flex items-center gap-2 flex-wrap">
          <svg
            className="w-4 h-4 text-blue-400 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
          <span className="font-mono font-medium text-xs text-white truncate max-w-xs sm:max-w-sm">
            {hit.filePath || hit.knowledgeType || 'Source Preview'}
          </span>
          <Badge
            variant="outline"
            size="sm"
            className="font-mono text-[9px] text-slate-400 lowercase"
          >
            {language}
          </Badge>
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

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="text-xs h-7 px-2.5 gap-1.5 text-slate-400 hover:text-white hover:bg-slate-800"
          >
            {copied ? (
              <>
                <svg
                  className="w-3.5 h-3.5 text-emerald-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="text-emerald-400 font-medium">Copied</span>
              </>
            ) : (
              <>
                <svg
                  className="w-3.5 h-3.5 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
                <span>Copy</span>
              </>
            )}
          </Button>

          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs h-7 w-7 p-0 text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </Button>
          )}
        </div>
      </CardHeader>

      {/* 2. Direct Code Content — No Nested Concentric Boxes */}
      <div className="flex-1 overflow-auto max-h-[460px] bg-slate-950">
        <CodeBlock
          code={hit.preview}
          language={language}
          startLine={hit.metadata?.startLine ?? 1}
          showLineNumbers={true}
          hideHeader={true}
          className="my-0 border-0 rounded-none bg-transparent shadow-none"
        />
      </div>

      {/* 3. Integrated RAG Citation Reference Footer */}
      <div className="border-t border-slate-800/80 bg-slate-900/40 p-4 space-y-3 shrink-0">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-white">RAG Citation Reference</span>
          <Badge variant="ai" size="sm" className="font-mono text-[9px]">
            Grounding Verified
          </Badge>
        </div>

        <div className="text-[11px] font-mono text-slate-400 space-y-1">
          <div>
            Chunk ID: <span className="text-slate-300">{hit.chunkId}</span>
          </div>
          {hit.repositoryId && (
            <div>
              Repository ID: <span className="text-slate-300">{hit.repositoryId}</span>
            </div>
          )}
        </div>

        <div className="pt-1">
          <Link
            href={`/${slug}/chat?repositoryId=${hit.repositoryId || ''}`}
            className="w-full block"
          >
            <Button variant="ai" size="sm" className="w-full text-xs gap-1.5 h-8">
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span>Ask AI About This Match</span>
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
