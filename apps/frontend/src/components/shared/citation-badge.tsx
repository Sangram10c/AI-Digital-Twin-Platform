'use client';

import { cn } from '@/utils/cn';
import { Tooltip } from '@/components/ui/tooltip';

export interface CitationProps {
  number?: number;
  sourceType?: 'FILE' | 'COMMIT' | 'PULL_REQUEST' | 'ISSUE' | 'DOCUMENTATION';
  title?: string;
  path?: string;
  excerpt?: string;
  relevanceScore?: number;
  onClick?: () => void;
  className?: string;
}

export function CitationBadge({
  number,
  sourceType = 'FILE',
  title,
  path,
  excerpt,
  relevanceScore,
  onClick,
  className,
}: CitationProps) {
  const iconMap = {
    FILE: (
      <svg
        className="h-3 w-3"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
        <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      </svg>
    ),
    COMMIT: (
      <svg
        className="h-3 w-3"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="3" />
        <line x1="3" x2="9" y1="12" y2="12" />
        <line x1="15" x2="21" y1="12" y2="12" />
      </svg>
    ),
    PULL_REQUEST: (
      <svg
        className="h-3 w-3"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="18" cy="18" r="3" />
        <circle cx="6" cy="6" r="3" />
        <path d="M13 6h3a2 2 0 0 1 2 2v7" />
        <line x1="6" x2="6" y1="9" y2="21" />
      </svg>
    ),
    ISSUE: (
      <svg
        className="h-3 w-3"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" x2="12" y1="8" y2="12" />
        <line x1="12" x2="12.01" y1="16" y2="16" />
      </svg>
    ),
    DOCUMENTATION: (
      <svg
        className="h-3 w-3"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
        <path d="M6 6h10" />
        <path d="M6 10h10" />
      </svg>
    ),
  };

  const displayText = path || title || 'Source';

  const tooltipContent = (
    <div className="max-w-xs space-y-1 text-left">
      <div className="flex items-center justify-between font-semibold">
        <span>{sourceType}</span>
        {relevanceScore !== undefined && (
          <span className="text-[10px] text-ai">{(relevanceScore * 100).toFixed(0)}% match</span>
        )}
      </div>
      {path && <p className="truncate text-muted-foreground font-mono text-[10px]">{path}</p>}
      {excerpt && (
        <p className="line-clamp-3 text-muted-foreground italic">&ldquo;{excerpt}&rdquo;</p>
      )}
    </div>
  );

  return (
    <Tooltip content={tooltipContent}>
      <button
        onClick={onClick}
        type="button"
        className={cn(
          'inline-flex items-center gap-1 rounded-md border border-ai/30 bg-ai/10 px-1.5 py-0.5 text-[11px] font-medium text-ai transition-colors hover:bg-ai/20 hover:border-ai/50 cursor-pointer select-none',
          className,
        )}
      >
        {number !== undefined && <span className="font-bold text-[10px]">[{number}]</span>}
        {iconMap[sourceType]}
        <span className="truncate max-w-[120px] sm:max-w-[160px] font-mono">{displayText}</span>
      </button>
    </Tooltip>
  );
}
