import { LoadingSpinner } from './loading-spinner';
import { cn } from '@/utils/cn';

export interface LoadingStateProps {
  title?: string;
  description?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingState({
  title = 'Loading...',
  description,
  className,
  size = 'lg',
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-border/40 bg-card/30 backdrop-blur-xs space-y-3 min-h-[240px]',
        className,
      )}
    >
      <LoadingSpinner size={size} />
      <div className="space-y-1">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        {description && <p className="text-xs text-muted-foreground max-w-sm">{description}</p>}
      </div>
    </div>
  );
}
