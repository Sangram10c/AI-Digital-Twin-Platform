import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

export interface ForbiddenStateProps {
  title?: string;
  description?: string;
  backHref?: string;
  backText?: string;
  className?: string;
}

export function ForbiddenState({
  title = 'Access Denied',
  description = "You don't have permission to view or manage this workspace area.",
  backHref = '/dashboard',
  backText = 'Return to Dashboard',
  className,
}: ForbiddenStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-border/60 bg-card/40 backdrop-blur-xs space-y-4 min-h-[300px]',
        className,
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/30">
        <svg
          className="h-7 w-7"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>

      <div className="space-y-1.5 max-w-md">
        <h3 className="text-base font-bold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>

      <Link href={backHref}>
        <Button variant="outline" size="sm">
          {backText}
        </Button>
      </Link>
    </div>
  );
}
