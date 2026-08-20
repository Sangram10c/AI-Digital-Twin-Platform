'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { useWorkspaceStore } from '@/store/workspace.store';
import { repositoryService } from '@/services/repository.service';
import { githubService, AvailableGithubRepository } from '@/services/github.service';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

export default function RepositoriesPage() {
  const params = useParams();
  const slug = (params?.workspaceSlug as string) || 'default';
  const { currentWorkspace, workspaces } = useWorkspaceStore();
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [connectError, setConnectError] = React.useState<string | null>(null);
  const [repoSearch, setRepoSearch] = React.useState('');
  const [importingId, setImportingId] = React.useState<string | null>(null);
  const [syncingRepoId, setSyncingRepoId] = React.useState<string | null>(null);

  const activeWorkspace = currentWorkspace ||
    workspaces.find((w) => w.slug === slug) || {
      id: 'default',
      name: slug,
      slug,
    };

  const workspaceId = activeWorkspace.id;

  // Real workspace repositories from database
  const { data: repos = [], isLoading: isReposLoading } = useQuery({
    queryKey: ['workspace', workspaceId, 'repositories'],
    queryFn: () => repositoryService.getRepositories(workspaceId),
    enabled: Boolean(workspaceId && workspaceId !== 'default'),
  });

  // Real connected GitHub accounts for this workspace
  const { data: githubAccounts = [], isLoading: isGithubLoading } = useQuery({
    queryKey: ['workspace', workspaceId, 'github', 'accounts'],
    queryFn: () => githubService.listWorkspaceAccounts(workspaceId),
    enabled: Boolean(workspaceId && workspaceId !== 'default'),
  });

  const isGithubConnected = githubAccounts.some((a) => a.status === 'ACTIVE');
  const primaryAccount = githubAccounts.find((a) => a.status === 'ACTIVE') || githubAccounts[0];

  // Remote repositories from connected GitHub account
  const {
    data: availableRepos = [],
    isLoading: isAvailableLoading,
    refetch: refetchAvailable,
  } = useQuery({
    queryKey: ['workspace', workspaceId, 'github', 'available-repos'],
    queryFn: () => githubService.listAvailableRepositories(workspaceId),
    enabled: Boolean(workspaceId && workspaceId !== 'default' && isGithubConnected),
  });

  // Trigger sync mutation scoped to specific repository
  const syncMutation = useMutation({
    mutationFn: async (repoId: string) => {
      setSyncingRepoId(repoId);
      return repositoryService.triggerSync(repoId, workspaceId, true);
    },
    onSettled: () => {
      setSyncingRepoId(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId, 'repositories'] });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId, 'analytics'] });
    },
  });

  // Import repository mutation
  const importMutation = useMutation({
    mutationFn: async (remoteRepo: AvailableGithubRepository) => {
      setImportingId(remoteRepo.id);
      const imported = await githubService.importRepository({
        workspaceId,
        providerRepositoryId: remoteRepo.id,
        name: remoteRepo.name,
        fullName: remoteRepo.fullName,
        description: remoteRepo.description,
        defaultBranch: remoteRepo.defaultBranch,
        isPrivate: remoteRepo.isPrivate,
        language: remoteRepo.language,
        url: remoteRepo.htmlUrl || remoteRepo.url,
      });

      // Automatically trigger sync for freshly imported repository
      if (imported?.id) {
        await repositoryService.triggerSync(imported.id, workspaceId, false);
      }
      return imported;
    },
    onSuccess: () => {
      setImportingId(null);
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId, 'repositories'] });
      queryClient.invalidateQueries({
        queryKey: ['workspace', workspaceId, 'github', 'available-repos'],
      });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId, 'analytics'] });
    },
    onError: (err) => {
      setImportingId(null);
      console.error('Import failed', err);
    },
  });

  const handleConnectGithub = async () => {
    try {
      setIsConnecting(true);
      setConnectError(null);
      const authUrl = await repositoryService.getConnectGithubUrl(
        workspaceId !== 'default' ? workspaceId : undefined,
      );
      if (authUrl) {
        window.location.href = authUrl;
      } else {
        setConnectError('Could not retrieve GitHub authorization URL.');
        setIsConnecting(false);
      }
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      setConnectError(
        apiErr.response?.data?.message || apiErr.message || 'Failed to connect GitHub',
      );
      setIsConnecting(false);
    }
  };

  const filteredAvailable = availableRepos.filter(
    (r) =>
      r.name.toLowerCase().includes(repoSearch.toLowerCase()) ||
      r.fullName.toLowerCase().includes(repoSearch.toLowerCase()),
  );

  const isLoading = isReposLoading || isGithubLoading;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white sm:text-2xl">Connected Repositories</h1>
            {isGithubConnected && (
              <Badge variant="success" size="sm" dot>
                GitHub Connected
              </Badge>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Import GitHub repositories, synchronize branch changes, and ground AI responses with
            code-aware AST index.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/settings/integrations/github">
            <Button variant="outline" size="sm">
              Integration Settings
            </Button>
          </Link>
          <Button
            size="sm"
            variant="ai"
            disabled={isConnecting}
            onClick={handleConnectGithub}
            className="gap-2"
          >
            {isConnecting ? (
              <LoadingSpinner size="sm" />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            )}
            <span>
              {isConnecting
                ? 'Connecting...'
                : isGithubConnected
                  ? 'Reconnect GitHub'
                  : 'Connect GitHub'}
            </span>
          </Button>
        </div>
      </div>

      {connectError && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-xs text-rose-300">
          {connectError}
        </div>
      )}

      {/* Connected GitHub Account Banner */}
      {isGithubConnected && primaryAccount && (
        <Card className="border border-slate-800 bg-[#0b101f] p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <Avatar
              src={primaryAccount.providerMetadata?.avatarUrl}
              fallback={primaryAccount.providerUsername || 'GH'}
              className="h-10 w-10 border border-slate-700 bg-slate-800"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">
                  @{primaryAccount.providerUsername || 'GitHub Account'}
                </span>
                <Badge size="sm" variant="success" dot>
                  Active Token
                </Badge>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                OAuth link established for {activeWorkspace.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => refetchAvailable()}
              className="text-xs gap-1.5"
            >
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              <span>Refresh GitHub List</span>
            </Button>
            <Link href="/settings/integrations/github">
              <Button size="sm" variant="outline" className="text-xs">
                Manage Connection
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Workspace Synced Repositories Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 space-y-3">
          <LoadingSpinner size="lg" />
          <span className="text-xs text-slate-400 font-mono">Loading repositories...</span>
        </div>
      ) : repos.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[11px]">
              Active Workspace Repositories ({repos.length})
            </h2>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-[#0b101f] overflow-hidden shadow-xl">
            <Table>
              <TableHeader className="bg-slate-900/60 border-b border-slate-800">
                <TableRow>
                  <TableHead className="text-slate-400">Repository</TableHead>
                  <TableHead className="text-slate-400">Branch</TableHead>
                  <TableHead className="text-slate-400">Commits</TableHead>
                  <TableHead className="text-slate-400">Pull Requests</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400">Last Synced</TableHead>
                  <TableHead className="text-right text-slate-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {repos.map((repo) => (
                  <TableRow
                    key={repo.id || repo.name}
                    className="border-b border-slate-800/60 hover:bg-slate-900/40"
                  >
                    <TableCell className="font-semibold text-white">
                      <Link
                        href={`/${slug}/repositories/${repo.id}`}
                        className="hover:text-blue-400 transition-colors font-bold block"
                      >
                        {repo.name}
                      </Link>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {repo.owner ? `${repo.owner}/${repo.name}` : repo.name}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-300">
                      {repo.defaultBranch || 'main'}
                    </TableCell>
                    <TableCell className="text-xs text-slate-300 font-mono">
                      {repo.commitsCount ?? 0}
                    </TableCell>
                    <TableCell className="text-xs text-slate-300 font-mono">
                      {repo.pullRequestsCount ?? 0}
                    </TableCell>
                    <TableCell>
                      <Badge
                        size="sm"
                        variant={repo.status === 'SYNCED' ? 'success' : 'secondary'}
                        dot
                      >
                        {repo.status || 'ACTIVE'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-400 text-xs font-mono">
                      {repo.lastSyncedAt ? new Date(repo.lastSyncedAt).toLocaleString() : 'Never'}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Link href={`/${slug}/chat?repositoryId=${repo.id}`}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs text-blue-400 hover:text-blue-300"
                        >
                          Chat
                        </Button>
                      </Link>
                      {(() => {
                        const isThisRepoSyncing = syncingRepoId === repo.id;
                        return (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isThisRepoSyncing}
                            onClick={() => syncMutation.mutate(repo.id)}
                            className="text-xs"
                          >
                            {isThisRepoSyncing ? (
                              <span className="flex items-center gap-1.5">
                                <LoadingSpinner size="sm" />
                                Syncing...
                              </span>
                            ) : (
                              'Trigger Sync'
                            )}
                          </Button>
                        );
                      })()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : null}

      {/* Available GitHub Repositories Browser & Importer */}
      {isGithubConnected && (
        <Card className="border border-slate-800 bg-[#0b101f] rounded-2xl shadow-xl">
          <CardHeader className="border-b border-slate-800/80 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base font-bold text-white">
                  Available GitHub Repositories
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Select repositories from your GitHub account to import and index into this
                  workspace.
                </CardDescription>
              </div>

              <div className="w-full sm:w-64">
                <Input
                  placeholder="Filter repositories..."
                  value={repoSearch}
                  onChange={(e) => setRepoSearch(e.target.value)}
                  className="bg-slate-900 border-slate-800 text-xs h-8"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-6">
            {isAvailableLoading ? (
              <div className="flex flex-col items-center justify-center p-8 space-y-3">
                <LoadingSpinner size="lg" />
                <span className="text-xs text-slate-400 font-mono">
                  Fetching your repositories from GitHub API...
                </span>
              </div>
            ) : filteredAvailable.length === 0 ? (
              <div className="text-center p-8 space-y-2">
                <span className="text-3xl">🔍</span>
                <p className="text-xs text-slate-400">
                  {repoSearch
                    ? `No GitHub repositories matching "${repoSearch}"`
                    : 'No repositories found in your GitHub account.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredAvailable.map((remote) => {
                  const isImporting = importingId === remote.id;
                  const isAlreadySynced =
                    remote.isImported ||
                    repos.some((r) => r.fullName === remote.fullName || r.name === remote.name);

                  return (
                    <div
                      key={remote.id}
                      className="flex flex-col justify-between p-4 rounded-xl border border-slate-800/80 bg-slate-900/40 hover:border-slate-700 transition-all space-y-3"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-semibold text-xs text-white truncate max-w-[240px]">
                            {remote.fullName}
                          </div>
                          <Badge
                            size="sm"
                            variant={remote.isPrivate ? 'secondary' : 'outline'}
                            className="text-[9px] shrink-0 font-mono"
                          >
                            {remote.isPrivate ? 'Private' : 'Public'}
                          </Badge>
                        </div>
                        {remote.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                            {remote.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                          {remote.language && <span>{remote.language}</span>}
                          {remote.defaultBranch && <span>• {remote.defaultBranch}</span>}
                          {remote.starsCount > 0 && <span>• ★ {remote.starsCount}</span>}
                        </div>

                        {isAlreadySynced ? (
                          <Badge size="sm" variant="success" className="text-[10px] font-mono">
                            ✓ Synced
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="ai"
                            disabled={isImporting || importMutation.isPending}
                            onClick={() => importMutation.mutate(remote)}
                            className="h-7 text-xs px-3"
                          >
                            {isImporting ? 'Importing...' : 'Import & Sync'}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Disconnected State Card */}
      {!isGithubConnected && !isLoading && (
        <Card className="border border-slate-800 bg-[#0b101f] p-12 text-center rounded-2xl shadow-xl space-y-4">
          <div className="flex justify-center text-4xl">📦</div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No repositories connected yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Connect your GitHub account to browse and synchronize your repositories into the AI
              Digital Twin.
            </p>
          </div>
          <Button size="sm" variant="ai" disabled={isConnecting} onClick={handleConnectGithub}>
            {isConnecting ? 'Connecting...' : 'Connect GitHub Account'}
          </Button>
        </Card>
      )}
    </div>
  );
}
