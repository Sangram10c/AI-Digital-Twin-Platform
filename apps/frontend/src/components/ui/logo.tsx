import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/utils/cn';

export interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  subtitle?: string;
  href?: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
}

export function Logo({
  size = 'sm',
  showText = true,
  subtitle,
  href = '/',
  className,
  imgClassName,
  priority = false,
}: LogoProps) {
  const sizeConfig = {
    xs: { dim: 20, class: 'h-5 w-5', text: 'text-xs', sub: 'text-[8px]' },
    sm: { dim: 28, class: 'h-7 w-7', text: 'text-sm', sub: 'text-[9px]' },
    md: { dim: 36, class: 'h-9 w-9', text: 'text-base', sub: 'text-[10px]' },
    lg: { dim: 48, class: 'h-12 w-12', text: 'text-lg', sub: 'text-xs' },
    xl: { dim: 64, class: 'h-16 w-16', text: 'text-xl', sub: 'text-xs' },
  };

  const currentSize = sizeConfig[size];

  const content = (
    <div className={cn('inline-flex items-center gap-2.5 select-none', className)}>
      <div
        className={cn(
          'relative overflow-hidden rounded-lg border border-border/50 bg-card shadow-xs transition-transform duration-200 hover:scale-105 shrink-0',
          currentSize.class,
          imgClassName,
        )}
      >
        <Image
          src="/logo.png"
          alt="AI Digital Twin Platform"
          width={currentSize.dim}
          height={currentSize.dim}
          priority={priority}
          className="h-full w-full object-cover rounded-lg"
        />
      </div>

      {showText && (
        <div className="flex flex-col">
          <span
            className={cn(
              'font-bold tracking-tight leading-none text-foreground',
              currentSize.text,
            )}
          >
            AI Digital Twin
          </span>
          <span
            className={cn('text-muted-foreground font-mono leading-tight mt-0.5', currentSize.sub)}
          >
            {subtitle || 'Enterprise Intelligence'}
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center">
        {content}
      </Link>
    );
  }

  return content;
}
