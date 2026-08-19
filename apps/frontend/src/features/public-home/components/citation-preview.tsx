'use client';

import { cn } from '@/utils/cn';

export interface CitationItem {
  id: string;
  sourceType: 'FILE' | 'PULL_REQUEST' | 'COMMIT' | 'DOCUMENT';
  title: string;
  reference: string;
  excerpt: string;
  score: number;
}

export function CitationPreview({
  citation,
  isSelected,
  onClick,
  className,
}: {
  citation: CitationItem;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const iconMap = {
    FILE: '📄',
    PULL_REQUEST: '🔀',
    COMMIT: '🌳',
    DOCUMENT: '📚',
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'group cursor-pointer rounded-lg border p-3 text-left transition-all duration-150',
        isSelected
          ? 'border-primary bg-primary/10 shadow-xs'
          : 'border-border/60 bg-card/50 hover:border-border hover:bg-card/90',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 truncate">
          <span className="text-xs">{iconMap[citation.sourceType]}</span>
          <span className="font-mono text-xs font-semibold text-foreground truncate">
            {citation.title}
          </span>
        </div>
        <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground shrink-0">
          {(citation.score * 100).toFixed(0)}% match
        </span>
      </div>

      <div className="font-mono text-[11px] text-primary/90 truncate mb-1">
        {citation.reference}
      </div>

      <p className="font-mono text-[10px] text-muted-foreground/80 line-clamp-2 bg-background/50 p-1.5 rounded border border-border/40">
        {citation.excerpt}
      </p>
    </div>
  );
}
