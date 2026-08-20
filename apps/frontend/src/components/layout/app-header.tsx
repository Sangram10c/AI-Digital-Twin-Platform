'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import { CommandPalette } from '@/components/shared/command-palette';
import { NotificationPopover } from './notification-popover';
import { UserNav } from './user-nav';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { WorkspaceSwitcher } from './workspace-switcher';
import { getWorkspaceNavSections } from '@/config/nav.config';
import { useUIStore } from '@/store/ui.store';
import { useWorkspaceStore } from '@/store/workspace.store';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/utils/cn';

export function AppHeader() {
  const params = useParams();
  const pathname = usePathname();
  const { toggleSidebar } = useUIStore();
  const { currentWorkspace } = useWorkspaceStore();
  const { userRole, workspaceRole, isAdmin } = usePermissions();
  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = React.useState(false);

  const slug = (params?.workspaceSlug as string) || currentWorkspace?.slug || 'default';
  const rawNavSections = getWorkspaceNavSections(slug);

  // Role and permission-aware filtering for mobile sheet navigation
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
            (!workspaceRole ||
              !item.requiredWorkspaceRole.includes(
                workspaceRole as unknown as import('@/types/workspace.types').WorkspaceRole,
              ))
          ) {
            if (!isAdmin) return false;
          }
          return true;
        }),
      }))
      .filter((section) => section.items.length > 0);
  }, [rawNavSections, userRole, workspaceRole, isAdmin]);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border/80 bg-background/80 px-3 sm:px-5 backdrop-blur-md">
        {/* Left Side: Toggle Sidebar & Breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Desktop sidebar collapse toggle */}
          <button
            onClick={toggleSidebar}
            className="hidden md:flex h-8 w-8 items-center justify-center rounded-xl border border-border/70 bg-card/40 text-muted-foreground hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            aria-label="Toggle sidebar"
          >
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M9 3v18" />
            </svg>
          </button>

          {/* Mobile drawer toggle */}
          <button
            onClick={() => setMobileSheetOpen(true)}
            className="flex md:hidden h-8 w-8 items-center justify-center rounded-xl border border-border/70 bg-card/40 text-muted-foreground hover:bg-slate-800 hover:text-white transition-colors"
            aria-label="Open mobile navigation"
          >
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
          </button>

          {/* Breadcrumbs */}
          <div className="min-w-0 truncate">
            <Breadcrumbs />
          </div>
        </div>

        {/* Right Side: Command Trigger, Notifications, UserNav */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Command Palette Trigger */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="hidden sm:flex h-8 items-center gap-2 rounded-xl border border-border/70 bg-card/40 px-3 text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors cursor-pointer"
          >
            <svg
              className="h-3.5 w-3.5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <span>Search or jump to...</span>
            <kbd className="rounded-md border border-border/80 bg-slate-800 px-1.5 font-mono text-[10px] text-slate-400">
              Ctrl+K
            </kbd>
          </button>

          {/* Mobile search trigger icon */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="flex sm:hidden h-8 w-8 items-center justify-center rounded-xl border border-border/70 bg-card/40 text-muted-foreground hover:bg-slate-800 hover:text-white"
            aria-label="Open command palette"
          >
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
          </button>

          {/* Notification Popover */}
          <NotificationPopover />

          {/* User Profile Dropdown */}
          <UserNav />
        </div>
      </header>

      {/* Global Command Palette */}
      <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />

      {/* Mobile Drawer Sheet */}
      <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
        <SheetContent side="left" className="w-72 p-4 bg-[#0b101f] border-r border-border">
          <div className="mb-6 pt-2">
            <WorkspaceSwitcher />
          </div>
          <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-140px)]">
            {navSections.map((section) => (
              <div key={section.title} className="space-y-1">
                <h4 className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-2 font-mono">
                  {section.title}
                </h4>
                <nav className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileSheetOpen(false)}
                        className={cn(
                          'flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors',
                          isActive
                            ? 'bg-primary/20 text-white border border-primary/30'
                            : 'text-slate-300 hover:bg-slate-800/60 hover:text-white',
                        )}
                      >
                        <span>{item.title}</span>
                        {item.badge && (
                          <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[9px] font-bold text-primary font-mono">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
