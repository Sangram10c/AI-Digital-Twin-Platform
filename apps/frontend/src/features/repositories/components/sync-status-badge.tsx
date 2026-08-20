'use client';

import { Badge } from '@/components/ui/badge';

interface SyncStatusBadgeProps {
  status?: string;
  isSyncing?: boolean;
}

export function SyncStatusBadge({ status = 'READY', isSyncing = false }: SyncStatusBadgeProps) {
  if (isSyncing || status === 'SYNCING') {
    return (
      <Badge variant="warning" size="sm" dot className="font-mono text-[10px]">
        Syncing...
      </Badge>
    );
  }

  const normalized = status.toUpperCase();

  switch (normalized) {
    case 'COMPLETED':
    case 'SYNCED':
    case 'ACTIVE':
    case 'READY':
      return (
        <Badge variant="success" size="sm" dot className="font-mono text-[10px]">
          Synced
        </Badge>
      );
    case 'FAILED':
    case 'ERROR':
      return (
        <Badge variant="destructive" size="sm" dot className="font-mono text-[10px]">
          Failed
        </Badge>
      );
    case 'PENDING':
    case 'QUEUED':
      return (
        <Badge variant="secondary" size="sm" dot className="font-mono text-[10px]">
          Queued
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" size="sm" className="font-mono text-[10px]">
          {status}
        </Badge>
      );
  }
}
