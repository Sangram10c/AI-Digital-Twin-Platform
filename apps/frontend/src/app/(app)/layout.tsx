'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { AppSidebar, AppHeader } from '@/components/layout';
import { useAuthStore } from '@/store/auth.store';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { AnimatedBackground } from '@/components/ui/animated-background';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full bg-background overflow-hidden">
      <AnimatedBackground variant="subtle" />

      {/* Collapsible Sidebar */}
      <div className="relative z-20 flex">
        <AppSidebar />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex flex-1 flex-col overflow-hidden min-w-0">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
