'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/utils/cn';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({
  items,
  className,
}: {
  items?: BreadcrumbItem[];
  className?: string;
}) {
  const pathname = usePathname();

  const generatedItems = React.useMemo(() => {
    if (items) return items;
    const segments = pathname.split('/').filter(Boolean);
    return segments.map((seg, i) => ({
      label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '),
      href: '/' + segments.slice(0, i + 1).join('/'),
    }));
  }, [items, pathname]);

  if (generatedItems.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center space-x-1.5 text-xs text-muted-foreground', className)}
    >
      {generatedItems.map((item, index) => {
        const isLast = index === generatedItems.length - 1;
        return (
          <React.Fragment key={index}>
            {index > 0 && <span className="text-muted-foreground/50 select-none">/</span>}
            {isLast || !item.href ? (
              <span className="font-medium text-foreground select-none">{item.label}</span>
            ) : (
              <Link
                href={item.href}
                className="transition-colors hover:text-foreground truncate max-w-[120px] sm:max-w-none"
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
