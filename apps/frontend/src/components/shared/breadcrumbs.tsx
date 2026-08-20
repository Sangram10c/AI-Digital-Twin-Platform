'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWorkspaceStore } from '@/store/workspace.store';
import { cn } from '@/utils/cn';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  repositories: 'Repositories',
  search: 'Hybrid Search',
  chat: 'AI Chat',
  conversations: 'Conversations',
  knowledge: 'Knowledge Base',
  timeline: 'Activity Timeline',
  analytics: 'Analytics & Insights',
  settings: 'Workspace Settings',
  members: 'Members & Roles',
  integrations: 'Integrations',
  admin: 'Platform Admin',
  github: 'GitHub Integration',
  google: 'Google Integration',
};

export function Breadcrumbs({
  items,
  className,
}: {
  items?: BreadcrumbItem[];
  className?: string;
}) {
  const pathname = usePathname();
  const { currentWorkspace, workspaces } = useWorkspaceStore();

  const generatedItems = React.useMemo(() => {
    if (items) return items;
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) return [];

    return segments.map((seg, i) => {
      // Check if this segment is a workspace slug
      if (i === 0) {
        const matchingWs =
          (currentWorkspace?.slug === seg ? currentWorkspace : null) ||
          workspaces.find((w) => w.slug === seg);
        if (matchingWs) {
          return {
            label: matchingWs.name,
            href: `/${seg}/dashboard`,
          };
        }
      }

      const cleanLabel =
        ROUTE_LABELS[seg.toLowerCase()] ||
        seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ');

      return {
        label: cleanLabel,
        href: '/' + segments.slice(0, i + 1).join('/'),
      };
    });
  }, [items, pathname, currentWorkspace, workspaces]);

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
            {index > 0 && <span className="text-muted-foreground/40 select-none">/</span>}
            {isLast || !item.href ? (
              <span className="font-semibold text-foreground select-none truncate max-w-[160px] sm:max-w-none">
                {item.label}
              </span>
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
