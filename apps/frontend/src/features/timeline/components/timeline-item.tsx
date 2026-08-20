'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TimelineEvent } from '../types/timeline.types';

interface TimelineItemProps {
  event: TimelineEvent;
}

export function TimelineItem({ event }: TimelineItemProps) {
  const getIcon = () => {
    switch (event.type) {
      case 'REPOSITORY_SYNC':
        return '🔄';
      case 'COMMIT':
        return '📦';
      case 'PULL_REQUEST':
        return '🔀';
      case 'ISSUE':
        return '🎯';
      case 'AI_CONVERSATION':
        return '💬';
      case 'RELEASE':
        return '🏷️';
      default:
        return '⚡';
    }
  };

  const getVariant = ():
    'default' | 'secondary' | 'outline' | 'ai' | 'success' | 'warning' | 'destructive' => {
    switch (event.type) {
      case 'REPOSITORY_SYNC':
        return 'success';
      case 'AI_CONVERSATION':
        return 'ai';
      case 'PULL_REQUEST':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="relative pl-6 sm:pl-8 group">
      {/* Timeline Node Point */}
      <div className="absolute -left-3 top-2.5 h-6 w-6 rounded-full border border-slate-700 bg-[#080d1a] flex items-center justify-center text-xs group-hover:border-blue-500 transition-colors">
        {getIcon()}
      </div>

      <Card className="p-4 rounded-2xl border border-slate-800 bg-[#0b101f] shadow-lg hover:border-slate-700 transition-colors space-y-2">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={getVariant()} size="sm" className="font-mono text-[9px]">
              {event.badgeText || event.type.replace(/_/g, ' ')}
            </Badge>
            {event.repositoryName && (
              <span className="text-[11px] font-mono text-slate-400">{event.repositoryName}</span>
            )}
          </div>
          <span className="text-[11px] font-mono text-slate-400">{event.date}</span>
        </div>

        <div className="space-y-1">
          <h4 className="text-xs font-bold text-white">{event.title}</h4>
          <p className="text-xs text-slate-300 leading-relaxed">{event.description}</p>
        </div>

        <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Author: {event.author}</span>
        </div>
      </Card>
    </div>
  );
}
