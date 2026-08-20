'use client';

import { Badge } from '@/components/ui/badge';

interface RelevanceBadgeProps {
  score?: number;
  mode?: string;
}

export function RelevanceBadge({ score, mode }: RelevanceBadgeProps) {
  if (score === undefined || score === null) {
    return (
      <Badge variant="secondary" size="sm" className="font-mono text-[10px]">
        {mode || 'Matched'}
      </Badge>
    );
  }

  // Convert decimal to percentage if between 0 and 1
  const pct = score <= 1 ? Math.round(score * 100) : Math.min(99, Math.round(score));

  let variant: 'ai' | 'success' | 'secondary' = 'secondary';
  if (pct >= 85) variant = 'ai';
  else if (pct >= 70) variant = 'success';

  return (
    <Badge variant={variant} size="sm" className="font-mono text-[10px]">
      {pct}% Match
    </Badge>
  );
}
