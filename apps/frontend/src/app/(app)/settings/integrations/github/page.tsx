'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { useWorkspaceStore } from '@/store/workspace.store';
import { githubService } from '@/services/github.service';
import { repositoryService } from '@/services/repository.service';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

function GithubIntegrationsContent() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { currentWorkspace, workspaces } = useWorkspaceStore();

  const urlStatus = searchParams.get('status');
  const urlMessage = searchParams.get('message');
  const urlWorkspaceId = searchParams.get('workspaceId');

  const activeWorkspace =
    (urlWorkspaceId ? workspaces.find((w) => w.id === urlWorkspaceId) : null) ||
    currentWorkspace ||
    workspaces[0];

  const workspaceId = activeWorkspace?.id;
  const workspaceSlug = activeWorkspace?.slug || 'default';

  // Fetch workspace connected GitHub accounts
  const { data: accounts = [], isLoading: isAccountsLoading } = useQuery({
    queryKey: ['workspace', workspaceId, 'github', 'accounts'],
    queryFn: () => (workspaceId ? githubService.listWorkspaceAccounts(workspaceId) : []),
    enabled: Boolean(workspaceId),
  });

  // Fetch user-level GitHub connections
  const { data: userAccounts = [], isLoading: isUserAccountsLoading } = useQuery({
    queryKey: ['user', 'github', 'accounts'],
    queryFn: () => githubService.listUserAccounts(),
  });

  const disconnectMutation = useMutation({
    mutationFn: (accountId: string) => {
      if (!workspaceId) throw new Error('No active workspace');
      return githubService.disconnectFromWorkspace(workspaceId, accountId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId, 'github'] });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId, 'repositories'] });
    },
  });

  const handleConnectMore = async () => {
    try {
      const authUrl = await repositoryService.getConnectGithubUrl(workspaceId);
      if (authUrl) {
        window.location.href = authUrl;
      }
    } catch (e) {
      console.error('Failed to initiate GitHub connect', e);
    }
  };

  const isLoading = isAccountsLoading || isUserAccountsLoading;

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white sm:text-2xl">GitHub Integration</h1>
            <Badge variant="ai" size="sm">
              OAuth 2.0
            </Badge>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Manage connected GitHub accounts, repository webhooks, and synchronization tokens.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href={`/${workspaceSlug}/repositories`}>
            <Button variant="outline" size="sm">
              View Repositories
            </Button>
          </Link>
          <Button variant="ai" size="sm" onClick={handleConnectMore}>
            Connect GitHub Account
          </Button>
        </div>
      </div>

      {/* OAuth Callback Alert Banner */}
      {urlStatus === 'connected' && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-emerald-400 text-lg">✓</span>
            <div>
              <div className="text-xs font-semibold text-emerald-300">
                GitHub Account Connected Successfully!
              </div>
              <div className="text-[11px] text-slate-400">
                Your repositories are now available for synchronization and AI ingestion.
              </div>
            </div>
          </div>
          <Link href={`/${workspaceSlug}/repositories`}>
            <Button size="sm" variant="ai">
              Manage Repos
            </Button>
          </Link>
        </div>
      )}

      {urlStatus === 'error' && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 flex items-center gap-3">
          <span className="text-amber-400 text-lg">ℹ</span>
          <div>
            <div className="text-xs font-semibold text-amber-300">Notice</div>
            <div className="text-[11px] text-slate-400">
              {urlMessage || 'GitHub operation completed.'}
            </div>
          </div>
        </div>
      )}

      {/* Connected Accounts for Current Workspace */}
      <Card className="border border-slate-800 bg-[#0b101f] rounded-2xl shadow-xl">
        <CardHeader className="border-b border-slate-800/80 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-white">
                Workspace Linked Accounts
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                GitHub accounts with repository access for{' '}
                <span className="text-blue-400 font-mono">
                  {activeWorkspace?.name || workspaceSlug}
                </span>
              </CardDescription>
            </div>
            <Badge variant="secondary" size="sm">
              {accounts.length} Linked
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-8 space-y-3">
              <LoadingSpinner size="lg" />
              <span className="text-xs text-slate-400 font-mono">
                Loading connected accounts...
              </span>
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center p-8 space-y-4">
              <div className="text-4xl">🐙</div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white">No GitHub accounts linked yet</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Link your personal or organization GitHub account to enable automated branch
                  syncing and code search.
                </p>
              </div>
              <Button size="sm" variant="ai" onClick={handleConnectMore}>
                Link GitHub Account
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {accounts.map((acc) => {
                const meta = acc.providerMetadata || {};
                const username = acc.providerUsername || meta.displayName || 'GitHub User';
                return (
                  <div
                    key={acc.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-800 bg-slate-900/50"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={meta.avatarUrl}
                        fallback={username}
                        className="h-10 w-10 border border-slate-700 bg-slate-800 text-white font-bold"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">@{username}</span>
                          <Badge
                            size="sm"
                            variant={acc.status === 'ACTIVE' ? 'success' : 'secondary'}
                            dot
                          >
                            {acc.status}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          ID: {acc.providerAccountId}
                          {acc.connectedAt && (
                            <span>
                              {' '}
                              • Connected: {new Date(acc.connectedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link href={`/${workspaceSlug}/repositories`}>
                        <Button size="sm" variant="outline">
                          View Repos
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/40"
                        disabled={disconnectMutation.isPending}
                        onClick={() => disconnectMutation.mutate(acc.id)}
                      >
                        Unlink
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User-Level Connected GitHub Tokens */}
      {userAccounts.length > 0 && (
        <Card className="border border-slate-800 bg-[#0b101f] rounded-2xl shadow-xl">
          <CardHeader className="border-b border-slate-800/80 pb-4">
            <CardTitle className="text-sm font-bold text-white">
              User-Level GitHub Connections
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Encrypted OAuth tokens associated with your user profile across all workspaces.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {userAccounts.map((uAcc) => (
              <div
                key={uAcc.id}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-800/60 bg-slate-950/40 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <Avatar src={uAcc.avatarUrl} fallback={uAcc.providerUsername || 'GH'} size="sm" />
                  <div>
                    <span className="font-semibold text-white">@{uAcc.providerUsername}</span>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Scopes: {uAcc.scopes?.join(', ') || 'read:user, repo'}
                    </div>
                  </div>
                </div>
                <Badge size="sm" variant="secondary" className="font-mono text-[10px]">
                  {uAcc.workspaces?.length ?? 0} Workspaces Linked
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function GithubIntegrationsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex justify-center p-12">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <GithubIntegrationsContent />
    </React.Suspense>
  );
}
