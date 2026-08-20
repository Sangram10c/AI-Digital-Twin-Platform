import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

export interface NotFoundStateProps {
  title?: string;
  description?: string;
  backHref?: string;
  backText?: string;
  className?: string;
}

export function NotFoundState({
  title = 'Page Not Found',
  description = "We couldn't find the resource or page you are looking for in this workspace.",
  backHref = '/dashboard',
  backText = 'Return to Dashboard',
  className,
}: NotFoundStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-border/60 bg-card/40 backdrop-blur-xs space-y-4 min-h-[300px]',
        className,
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground border border-border">
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
          <circle cx="12" cy="12" r="10" />
          <path d="m4.93 4.93 4.24 4.24" />
          <path d="m14.83 9.17 4.24-4.24" />
          <path d="m14.83 14.83 4.24 4.24" />
          <path d="m9.17 14.83-4.24 4.24" />
          <circle cx="12" cy="12" r="4" />
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
