'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AppSidebar, AppHeader } from '@/components/layout';
import { useAuthStore } from '@/store/auth.store';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { cn } from '@/utils/cn';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuthStore();

  const isChat = Boolean(pathname?.includes('/chat'));

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) {
        router.push('/login');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-screen bg-background overflow-hidden">
      <AnimatedBackground variant="subtle" />

      {/* Collapsible Sidebar */}
      <div className="relative z-20 flex h-full shrink-0">
        <AppSidebar />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex flex-1 flex-col h-full overflow-hidden min-w-0">
        <AppHeader />
        <main
          className={cn(
            'flex-1 min-h-0 min-w-0 flex flex-col',
            isChat ? 'overflow-hidden p-0' : 'overflow-y-auto p-4 sm:p-6 lg:p-8',
          )}
        >
          <div
            className={cn(
              'flex-1 min-h-0',
              isChat ? 'w-full h-full max-w-none flex flex-col' : 'mx-auto w-full max-w-7xl',
            )}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
