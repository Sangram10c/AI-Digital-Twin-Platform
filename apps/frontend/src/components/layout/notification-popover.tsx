'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  createdAt: string;
  isRead: boolean;
}

export function NotificationPopover() {
  const [activeTab, setActiveTab] = React.useState('all');
  // Foundation state: when notifications API is linked, this queries live user notifications
  const [notifications] = React.useState<NotificationItem[]>([]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-9 w-9 rounded-xl p-0 hover:bg-slate-800 text-slate-300 hover:text-white"
          aria-label="Notifications"
        >
          <svg
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>

          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white shadow-sm">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="right"
        className="w-80 sm:w-96 rounded-2xl border border-border bg-[#0b101f] p-0 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-border/80 px-4 py-3 bg-slate-900/60">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white">Notifications</span>
            {unreadCount > 0 && (
              <Badge size="sm" variant="ai" className="text-[10px]">
                {unreadCount} unread
              </Badge>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b border-border/60 px-3 pt-2">
            <TabsList className="h-8 bg-transparent gap-1 p-0">
              <TabsTrigger
                value="all"
                className="h-7 text-xs rounded-lg data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400"
              >
                All
              </TabsTrigger>
              <TabsTrigger
                value="system"
                className="h-7 text-xs rounded-lg data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400"
              >
                System
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="m-0 p-4">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-slate-400 border border-slate-800">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-white">All caught up!</p>
                  <p className="text-[11px] text-slate-400">
                    No new notifications in this workspace.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl border border-border/50 bg-slate-900/40 text-xs space-y-1"
                  >
                    <div className="font-semibold text-white">{item.title}</div>
                    <div className="text-slate-400 text-[11px]">{item.message}</div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="system" className="m-0 p-4">
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-slate-400 border border-slate-800">
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>
              <p className="text-xs font-semibold text-white">No system alerts</p>
              <p className="text-[11px] text-slate-400">
                All background jobs and ingestion pipelines are healthy.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
