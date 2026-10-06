'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RelevanceBadge } from './relevance-badge';
import { RankedSearchHit } from '../types/search.types';

interface SearchResultCardProps {
  hit: RankedSearchHit;
  isSelected: boolean;
  onSelect: () => void;
}

export function SearchResultCard({ hit, isSelected, onSelect }: SearchResultCardProps) {
  const fileName = hit.filePath
    ? hit.filePath.split('/').pop()
    : hit.knowledgeType || 'Source Chunk';
  const startLine = hit.metadata?.startLine;
  const endLine = hit.metadata?.endLine;
  const lineInfo = startLine ? `L${startLine}${endLine ? `-${endLine}` : ''}` : null;

  // Clean, trim, and de-indent preview lines for a crisp, legible snippet
  const previewLines = React.useMemo(() => {
    if (!hit.preview) return [];
    const rawLines = hit.preview.replace(/\r\n/g, '\n').split('\n');

    // Trim leading/trailing blank lines
    while (rawLines.length > 0 && !rawLines[0].trim()) rawLines.shift();
    while (rawLines.length > 0 && !rawLines[rawLines.length - 1].trim()) rawLines.pop();

    if (rawLines.length === 0) return [];

    // Find minimum indentation among non-empty lines to dedent
    const nonEmpty = rawLines.filter((l) => l.trim().length > 0);
    const minIndent = nonEmpty.reduce((min, l) => {
      const match = l.match(/^[ \t]*/);
      return Math.min(min, match ? match[0].length : 0);
    }, Infinity);

    const strip = minIndent < Infinity && minIndent > 0 ? minIndent : 0;
    return rawLines.slice(0, 4).map((l) => l.slice(strip));
  }, [hit.preview]);

  return (
    <Card
      onClick={onSelect}
      className={`p-4 rounded-xl border cursor-pointer transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-950/20 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/30'
          : 'border-slate-800 bg-[#0b101f] hover:border-slate-700 hover:bg-slate-900/40'
      } space-y-2.5`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-900 border border-slate-800 text-xs shrink-0 text-blue-400">
            <svg
              className="h-3.5 w-3.5"
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
          </div>
          <span className="font-semibold text-xs text-white truncate">{fileName}</span>
          {hit.repositoryName && (
            <Badge variant="secondary" size="sm" className="font-mono text-[9px]">
              {hit.repositoryName}
            </Badge>
          )}
          {lineInfo && (
            <Badge variant="outline" size="sm" className="font-mono text-[9px] text-slate-400">
              {lineInfo}
            </Badge>
          )}
        </div>

        <RelevanceBadge score={hit.finalScore || hit.similarityScore} />
      </div>

      {hit.filePath && (
        <div className="text-[11px] font-mono text-slate-400 truncate pl-0.5">{hit.filePath}</div>
      )}

      {/* Code Snippet Box */}
      <div className="rounded-lg border border-slate-850 bg-slate-950/80 p-2.5 font-mono text-[11.5px] leading-relaxed text-slate-300 overflow-hidden shadow-inner">
        {previewLines.length === 0 ? (
          <div className="text-slate-500 italic text-[11px]">No preview text available</div>
        ) : (
          <div className="space-y-0.5">
            {previewLines.map((line, idx) => (
              <div key={idx} className="flex items-center gap-2.5 overflow-hidden">
                <span className="select-none text-[10px] text-slate-600 font-mono w-5 text-right shrink-0">
                  {startLine ? startLine + idx : idx + 1}
                </span>
                <span className="truncate text-slate-300 font-mono flex-1">{line || ' '}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
