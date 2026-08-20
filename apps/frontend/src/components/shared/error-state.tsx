import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  actionText?: string;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'An error occurred while loading this section. Please try again.',
  onRetry,
  actionText = 'Try Again',
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-destructive/20 bg-destructive/5 backdrop-blur-xs space-y-4 min-h-[260px]',
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive border border-destructive/30">
        <svg
          className="h-6 w-6"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" x2="12" y1="8" y2="12" />
          <line x1="12" x2="12.01" y1="16" y2="16" />
        </svg>
      </div>

      <div className="space-y-1.5 max-w-md">
        <h4 className="text-base font-bold text-foreground">{title}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>

      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
          <svg
            className="h-3.5 w-3.5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
          {actionText}
        </Button>
      )}
    </div>
  );
}
