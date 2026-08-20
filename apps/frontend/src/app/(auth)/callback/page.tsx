'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services/auth.service';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuthStore();
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const processCallback = async () => {
      const token = searchParams.get('token') || searchParams.get('access_token');
      const err = searchParams.get('error');

      if (err) {
        setError(err);
        return;
      }

      if (token) {
        localStorage.setItem('access_token', token);
        try {
          const profile = await authService.getProfile();
          if (profile) {
            login(profile, token);
            router.push('/workspaces');
            return;
          }
        } catch {
          // ignore
        }
      }

      router.push('/login');
    };

    processCallback();
  }, [searchParams, login, router]);

  if (error) {
    return (
      <div className="text-center space-y-3 p-6">
        <h2 className="text-base font-semibold text-destructive">OAuth Authentication Failed</h2>
        <p className="text-xs text-muted-foreground">{error}</p>
        <button
          onClick={() => router.push('/login')}
          className="mt-4 text-xs font-semibold text-primary underline cursor-pointer"
        >
          Return to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <LoadingSpinner size="lg" />
      <span className="text-xs font-medium text-muted-foreground">
        Completing secure sign in...
      </span>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
          <LoadingSpinner size="lg" />
          <span className="text-xs font-medium text-muted-foreground">
            Loading authentication...
          </span>
        </div>
      }
    >
      <CallbackContent />
    </React.Suspense>
  );
}
