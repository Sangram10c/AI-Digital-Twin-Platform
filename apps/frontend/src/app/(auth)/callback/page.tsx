'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useWorkspaceStore } from '@/store/workspace.store';
import { workspaceService } from '@/services/workspace.service';
import { UserRole } from '@/types/user.types';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuthStore();
  const { setWorkspaces, resolveActiveWorkspace } = useWorkspaceStore();
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const processCallback = async () => {
      const token = searchParams.get('token') || searchParams.get('access_token');
      const refreshToken =
        searchParams.get('refreshToken') || searchParams.get('refresh_token') || '';
      const err =
        searchParams.get('error') ||
        searchParams.get('error_description') ||
        searchParams.get('message');
      const status = searchParams.get('status');

      if (err || status === 'error') {
        setError(err || 'Authentication failed. Please verify your credentials.');
        return;
      }

      if (token) {
        try {
          const workspaces = await workspaceService.getWorkspaces();
          setWorkspaces(workspaces);
          const active = resolveActiveWorkspace();

          // Fallback user until profile query updates
          login(
            {
              id: 'authenticated-user',
              email: 'developer@workspace',
              role: UserRole.USER,
            },
            { accessToken: token, refreshToken },
          );

          if (active) {
            router.push(`/${active.slug}/dashboard`);
          } else {
            router.push('/workspaces');
          }
          return;
        } catch {
          // Token might still be valid, route to workspaces
          router.push('/workspaces');
          return;
        }
      }

      // If GitHub callback parameters are detected without direct token, route to /callback/github
      if (searchParams.get('githubTokenId') || searchParams.get('code')) {
        router.push(`/callback/github?${searchParams.toString()}`);
        return;
      }

      router.push('/login');
    };

    processCallback();
  }, [searchParams, login, router, setWorkspaces, resolveActiveWorkspace]);

  if (error) {
    return (
      <Card className="border border-slate-800/80 bg-[#0b101f] shadow-2xl rounded-2xl text-center p-6">
        <CardHeader className="space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-950/50 border border-rose-500/30 text-rose-400 text-2xl">
            ✕
          </div>
          <CardTitle className="text-lg font-bold text-white">
            OAuth Authentication Failed
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">{error}</CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/login')}
            className="w-full text-xs"
          >
            Return to Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-slate-800/80 bg-[#0b101f] shadow-2xl rounded-2xl text-center p-8 space-y-4">
      <LoadingSpinner size="lg" />
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-white">Completing secure sign in...</h3>
        <p className="text-xs text-slate-400 font-mono">Restoring authenticated session</p>
      </div>
    </Card>
  );
}

export default function AuthCallbackPage() {
  return (
    <React.Suspense
      fallback={
        <Card className="border border-slate-800/80 bg-[#0b101f] shadow-2xl rounded-2xl text-center p-8 space-y-4">
          <LoadingSpinner size="lg" />
          <span className="text-xs text-slate-400 font-mono">Loading authentication...</span>
        </Card>
      }
    >
      <CallbackContent />
    </React.Suspense>
  );
}
