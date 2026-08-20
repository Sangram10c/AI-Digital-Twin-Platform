'use client';

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

  return (
    <Card
      onClick={onSelect}
      className={`p-4 rounded-xl border cursor-pointer transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-950/20 shadow-lg shadow-blue-500/10'
          : 'border-slate-800 bg-[#0b101f] hover:border-slate-700 hover:bg-slate-900/40'
      } space-y-2`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-900 border border-slate-800 text-xs shrink-0 text-blue-400">
            📄
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
        <div className="text-[11px] font-mono text-slate-400 truncate">{hit.filePath}</div>
      )}

      <div className="text-xs text-slate-300 font-mono bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 line-clamp-3 leading-relaxed whitespace-pre-wrap">
        {hit.preview || 'No preview text available'}
      </div>
    </Card>
  );
}
