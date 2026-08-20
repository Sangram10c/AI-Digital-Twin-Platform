'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { getWorkspaceNavSections } from '@/config/nav.config';
import { WorkspaceSwitcher } from './workspace-switcher';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/ui/logo';
import { Tooltip } from '@/components/ui/tooltip';
import { useUIStore } from '@/store/ui.store';
import { useWorkspaceStore } from '@/store/workspace.store';
import { usePermissions } from '@/hooks/use-permissions';
import { WorkspaceRole } from '@/types/workspace.types';
import { cn } from '@/utils/cn';

export function AppSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const { isSidebarOpen } = useUIStore();
  const { currentWorkspace } = useWorkspaceStore();
  const { userRole, workspaceRole, isAdmin } = usePermissions();

  const slug = (params?.workspaceSlug as string) || currentWorkspace?.slug || 'default';
  const rawNavSections = getWorkspaceNavSections(slug);

  // Role and permission-aware filtering
  const navSections = React.useMemo(() => {
    return rawNavSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          if (item.requiredUserRole && (!userRole || !item.requiredUserRole.includes(userRole))) {
            if (!isAdmin) return false;
          }
          if (
            item.requiredWorkspaceRole &&
            (!workspaceRole || !item.requiredWorkspaceRole.includes(workspaceRole as WorkspaceRole))
          ) {
            if (!isAdmin) return false;
          }
          return true;
        }),
      }))
      .filter((section) => section.items.length > 0);
  }, [rawNavSections, userRole, workspaceRole, isAdmin]);

  const iconMap: Record<string, React.ReactNode> = {
    LayoutDashboard: (
      <svg
        className="h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect width="7" height="9" x="3" y="3" rx="1" />
        <rect width="7" height="5" x="14" y="3" rx="1" />
        <rect width="7" height="9" x="14" y="12" rx="1" />
        <rect width="7" height="5" x="3" y="16" rx="1" />
      </svg>
    ),
    GitFork: (
      <svg
        className="h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="18" r="3" />
        <circle cx="6" cy="6" r="3" />
        <circle cx="18" cy="6" r="3" />
        <path d="M18 9v2a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9" />
        <path d="M12 12v3" />
      </svg>
    ),
    History: (
      <svg
        className="h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
        <path d="M12 7v5l4 2" />
      </svg>
    ),
    Bot: (
      <svg
        className="h-4 w-4 text-primary"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 8V4H8" />
        <rect width="16" height="12" x="4" y="8" rx="2" />
        <path d="M2 14h2" />
        <path d="M20 14h2" />
        <path d="M15 13v2" />
        <path d="M9 13v2" />
      </svg>
    ),
    Search: (
      <svg
        className="h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    ),
    Brain: (
      <svg
        className="h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
        <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
        <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
        <path d="M12 18v4" />
      </svg>
    ),
    BarChart3: (
      <svg
        className="h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M3 3v18h18" />
        <path d="M18 17V9" />
        <path d="M13 17V5" />
        <path d="M8 17v-3" />
      </svg>
    ),
    Settings: (
      <svg
        className="h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    Users: (
      <svg
        className="h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    PlugZap: (
      <svg
        className="h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M6.3 20.3a2.4 2.4 0 0 0 3.4 0L12 18l-6-6-2.3 2.3a2.4 2.4 0 0 0 0 3.4Z" />
        <path d="m2 22 3-3" />
        <path d="M7.5 13.5 10 11" />
        <path d="M10.5 16.5 13 14" />
        <path d="m17 4 3-3" />
        <path d="m14 7 3-3" />
      </svg>
    ),
  };

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col border-r border-border/80 bg-[#0b101f]/80 backdrop-blur-md transition-all duration-200 select-none shrink-0',
        isSidebarOpen ? 'w-64' : 'w-16',
      )}
      aria-label="Sidebar Navigation"
    >
      {/* Workspace Switcher Header */}
      <div className="flex h-14 items-center border-b border-border/80 px-3">
        {isSidebarOpen ? (
          <WorkspaceSwitcher />
        ) : (
          <div className="mx-auto">
            <Logo size="sm" showText={false} />
          </div>
        )}
      </div>

      {/* Categorized Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            {isSidebarOpen && (
              <h4 className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-2 font-mono">
                {section.title}
              </h4>
            )}
            <nav className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

                const linkContent = (
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium transition-colors',
                      isActive
                        ? 'bg-primary/20 text-white border border-primary/30 font-semibold'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-white',
                      !isSidebarOpen && 'justify-center px-0 h-10 w-10 mx-auto',
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {item.icon && iconMap[item.icon]}
                    {isSidebarOpen && (
                      <div className="flex items-center justify-between flex-1 truncate">
                        <span className="truncate">{item.title}</span>
                        {item.badge && (
                          <Badge size="sm" variant="ai" className="text-[9px] px-1 py-0 font-mono">
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                    )}
                  </Link>
                );

                if (!isSidebarOpen) {
                  return (
                    <Tooltip key={item.href} content={item.title} side="right">
                      {linkContent}
                    </Tooltip>
                  );
                }

                return <React.Fragment key={item.href}>{linkContent}</React.Fragment>;
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Footer info */}
      {isSidebarOpen ? (
        <div className="border-t border-border/80 p-3 text-[11px] text-muted-foreground flex items-center justify-between font-mono">
          <span>v1.0.0</span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Connected
          </span>
        </div>
      ) : (
        <div className="border-t border-border/80 p-3 flex justify-center">
          <span className="h-2 w-2 rounded-full bg-emerald-400" title="System Connected" />
        </div>
      )}
    </aside>
  );
}
