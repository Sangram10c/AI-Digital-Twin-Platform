'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { useWorkspaceStore } from '@/store/workspace.store';
import { githubService } from '@/services/github.service';
import { repositoryService } from '@/services/repository.service';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { PageHeader } from '@/components/shared/page-header';

export default function WorkspaceIntegrationsPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const slug = (params?.workspaceSlug as string) || 'default';
  const { currentWorkspace, workspaces } = useWorkspaceStore();
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [connectError, setConnectError] = React.useState<string | null>(null);

  const activeWorkspace = currentWorkspace ||
    workspaces.find((w) => w.slug === slug) || {
      id: 'default',
      name: slug,
      slug,
    };

  const workspaceId = activeWorkspace.id;

  // Real connected GitHub accounts for this workspace
  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['workspace', workspaceId, 'github', 'accounts'],
    queryFn: () => githubService.listWorkspaceAccounts(workspaceId),
    enabled: Boolean(workspaceId && workspaceId !== 'default'),
  });

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: (accountId: string) =>
      githubService.disconnectFromWorkspace(workspaceId, accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['workspace', workspaceId, 'github', 'accounts'],
      });
      queryClient.invalidateQueries({
        queryKey: ['workspace', workspaceId, 'repositories'],
      });
    },
  });

  const handleConnectGithub = async () => {
    try {
      setIsConnecting(true);
      setConnectError(null);
      const authUrl = await repositoryService.getConnectGithubUrl(workspaceId);
      if (authUrl) {
        window.location.href = authUrl;
      }
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setConnectError(apiErr.response?.data?.message || 'Failed to initiate GitHub connection');
      setIsConnecting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-16">
      <PageHeader
        title="Workspace Integrations"
        description="Connect third-party Git providers, webhooks, and AI platforms to power codebase indexing."
        badge={
          <Badge variant="outline" className="font-mono text-[10px]">
            {accounts.length} Connected
          </Badge>
        }
        actions={
          <Link href={`/${slug}/settings`}>
            <Button variant="outline" size="sm" className="text-xs">
              ← Workspace Settings
            </Button>
          </Link>
        }
      />

      {connectError && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-3.5 text-xs text-rose-300">
          {connectError}
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 space-y-3">
          <LoadingSpinner size="lg" />
          <span className="text-xs text-slate-400 font-mono">Loading integrations...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {/* GitHub Provider Card */}
          <Card className="border border-slate-800 bg-[#0b101f] p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-white">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-white">GitHub OAuth</CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Repository cloning, AST code extraction, commit & PR webhooks.
                  </CardDescription>
                </div>
              </div>

              <Button
                variant="ai"
                size="sm"
                disabled={isConnecting}
                onClick={handleConnectGithub}
                className="text-xs"
              >
                {isConnecting ? 'Connecting...' : 'Connect Another Account'}
              </Button>
            </div>

            <CardContent className="p-0 pt-3">
              {accounts.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-800 bg-slate-900/30 text-center text-xs text-slate-400">
                  No GitHub accounts linked to this workspace yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {accounts.map((acc) => (
                    <div
                      key={acc.id}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/40"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={acc.providerMetadata?.avatarUrl}
                          fallback={acc.providerUsername || 'GH'}
                          className="h-8 w-8 text-xs bg-slate-800 border border-slate-700"
                        />
                        <div>
                          <div className="font-semibold text-xs text-white">
                            @{acc.providerUsername || 'GitHub User'}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            Linked:{' '}
                            {acc.connectedAt
                              ? new Date(acc.connectedAt).toLocaleDateString()
                              : 'Active'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge size="sm" variant="success" dot className="font-mono text-[10px]">
                          {acc.status}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={disconnectMutation.isPending}
                          onClick={() => disconnectMutation.mutate(acc.id)}
                          className="h-7 text-xs text-rose-400 hover:bg-rose-950/40 hover:text-rose-300"
                        >
                          Unlink
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
