'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useAuthStore } from '@/store/auth.store';
import { useWorkspaceStore } from '@/store/workspace.store';
import { cn } from '@/utils/cn';

interface CommandItem {
  id: string;
  title: string;
  category: 'Navigation' | 'Actions' | 'Workspaces';
  icon?: React.ReactNode;
  href?: string;
  action?: () => void;
}

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const params = useParams();
  const { logout } = useAuthStore();
  const { currentWorkspace, workspaces, setCurrentWorkspace } = useWorkspaceStore();
  const [query, setQuery] = React.useState('');
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  const slug = (params?.workspaceSlug as string) || currentWorkspace?.slug || 'default';

  // Global Ctrl+K / Cmd+K listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  const items: CommandItem[] = React.useMemo(() => {
    const baseItems: CommandItem[] = [
      {
        id: 'nav-dashboard',
        title: 'Dashboard Overview',
        category: 'Navigation',
        href: `/${slug}/dashboard`,
      },
      {
        id: 'nav-chat',
        title: 'AI Chat & Conversations',
        category: 'Navigation',
        href: `/${slug}/chat`,
      },
      {
        id: 'nav-search',
        title: 'Hybrid Code & History Search',
        category: 'Navigation',
        href: `/${slug}/search`,
      },
      {
        id: 'nav-repositories',
        title: 'Connected Repositories',
        category: 'Navigation',
        href: `/${slug}/repositories`,
      },
      {
        id: 'nav-knowledge',
        title: 'Knowledge Base & Architecture Docs',
        category: 'Navigation',
        href: `/${slug}/knowledge`,
      },
      {
        id: 'nav-timeline',
        title: 'Activity & Commit Timeline',
        category: 'Navigation',
        href: `/${slug}/timeline`,
      },
      {
        id: 'nav-analytics',
        title: 'Analytics & Insights Dashboard',
        category: 'Navigation',
        href: `/${slug}/analytics`,
      },
      {
        id: 'nav-settings',
        title: 'Workspace Settings & Team',
        category: 'Navigation',
        href: `/${slug}/settings`,
      },
      {
        id: 'nav-integrations',
        title: 'GitHub & Integrations',
        category: 'Navigation',
        href: `/settings/integrations/github`,
      },
      {
        id: 'act-logout',
        title: 'Sign Out of Account',
        category: 'Actions',
        action: () => {
          logout();
          router.push('/login');
        },
      },
    ];

    // Add workspace switcher items
    if (workspaces.length > 1) {
      workspaces.forEach((ws) => {
        if (ws.id !== currentWorkspace?.id) {
          baseItems.push({
            id: `ws-${ws.id}`,
            title: `Switch to Workspace: ${ws.name}`,
            category: 'Workspaces',
            action: () => {
              setCurrentWorkspace(ws);
              router.push(`/${ws.slug}/dashboard`);
            },
          });
        }
      });
    }

    return baseItems;
  }, [slug, logout, router, workspaces, currentWorkspace, setCurrentWorkspace]);

  const filteredItems = React.useMemo(() => {
    if (!query.trim()) return items;
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase()),
    );
  }, [items, query]);

  const handleSelect = (item: CommandItem) => {
    onOpenChange(false);
    setQuery('');
    if (item.href) {
      router.push(item.href);
    } else if (item.action) {
      item.action();
    }
  };

  // Keyboard navigation inside the palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden border border-border bg-[#0b101f] shadow-2xl rounded-2xl">
        {/* Search Input Bar */}
        <div className="flex items-center border-b border-border/70 px-4 py-3 bg-slate-900/60">
          <svg
            className="mr-3 h-4 w-4 shrink-0 text-muted-foreground"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search destination... (ESC to close)"
            className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground/60 text-white focus:outline-none"
            autoFocus
          />
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-border/80 bg-slate-800 px-1.5 font-mono text-[10px] font-medium text-slate-400 sm:flex">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[340px] overflow-y-auto p-2">
          {filteredItems.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground">
              No matching actions or navigation targets found.
            </div>
          ) : (
            <div className="space-y-1">
              {filteredItems.map((item, index) => {
                const isSelected = selectedIndex === index;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      'flex cursor-pointer select-none items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition-colors',
                      isSelected
                        ? 'bg-primary/20 text-white border border-primary/30'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white',
                    )}
                  >
                    <span className="flex items-center gap-2.5 truncate">{item.title}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono shrink-0 ml-2">
                      {item.category}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border/70 bg-slate-950/60 px-4 py-2 text-[11px] text-muted-foreground font-mono">
          <span>AI Digital Twin Platform</span>
          <div className="flex items-center gap-2">
            <span>↑↓ Navigate</span>
            <span>•</span>
            <span>↵ Select</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
