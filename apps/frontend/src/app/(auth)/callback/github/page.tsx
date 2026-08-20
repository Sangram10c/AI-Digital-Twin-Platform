'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useWorkspaceStore } from '@/store/workspace.store';
import { workspaceService } from '@/services/workspace.service';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

function GithubCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setWorkspaces, resolveActiveWorkspace } = useWorkspaceStore();

  const [status, setStatus] = React.useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function processGithubCallback() {
      const err =
        searchParams.get('error') ||
        searchParams.get('error_description') ||
        searchParams.get('message');
      const callbackStatus = searchParams.get('status');
      const workspaceId = searchParams.get('workspaceId');

      if (err || callbackStatus === 'error') {
        setStatus('error');
        setErrorMessage(err || 'GitHub authentication or connection was cancelled or failed.');
        return;
      }

      try {
        // Load latest workspace memberships
        const workspaces = await workspaceService.getWorkspaces();
        setWorkspaces(workspaces);

        if (workspaceId) {
          const matching = workspaces.find((w) => w.id === workspaceId);
          if (matching) {
            setStatus('success');
            setTimeout(() => router.push(`/${matching.slug}/dashboard`), 1000);
            return;
          }
        }

        const active = resolveActiveWorkspace();
        setStatus('success');

        if (active) {
          setTimeout(() => router.push(`/${active.slug}/dashboard`), 1000);
        } else {
          setTimeout(() => router.push('/workspaces'), 1000);
        }
      } catch (e: unknown) {
        const error = e as Error;
        setStatus('error');
        setErrorMessage(
          error.message || 'Unable to load workspace profile after GitHub authentication.',
        );
      }
    }

    processGithubCallback();
  }, [searchParams, router, setWorkspaces, resolveActiveWorkspace]);

  if (status === 'error') {
    return (
      <Card className="border border-slate-800/80 bg-[#0b101f] shadow-2xl rounded-2xl text-center p-6">
        <CardHeader className="space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-950/50 border border-rose-500/30 text-rose-400 text-2xl">
            ✕
          </div>
          <CardTitle className="text-lg font-bold text-white">GitHub Connection Failed</CardTitle>
          <CardDescription className="text-xs text-slate-400">
            {errorMessage || 'An error occurred during GitHub authentication.'}
          </CardDescription>
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
        <h3 className="text-sm font-semibold text-white">
          {status === 'success'
            ? 'Connected successfully! Redirecting...'
            : 'Verifying GitHub Connection...'}
        </h3>
        <p className="text-xs text-slate-400 font-mono">
          Setting up your authenticated project session
        </p>
      </div>
    </Card>
  );
}

export default function GithubCallbackPage() {
  return (
    <React.Suspense
      fallback={
        <Card className="border border-slate-800/80 bg-[#0b101f] shadow-2xl rounded-2xl text-center p-8 space-y-4">
          <LoadingSpinner size="lg" />
          <span className="text-xs text-slate-400 font-mono">Loading OAuth handshake...</span>
        </Card>
      }
    >
      <GithubCallbackContent />
    </React.Suspense>
  );
}
