'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useWorkspaceStore } from '@/store/workspace.store';
import { workspaceService } from '@/services/workspace.service';

export default function WorkspacesPage() {
  const router = useRouter();
  const { workspaces, setWorkspaces, setCurrentWorkspace } = useWorkspaceStore();
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = React.useState('');
  const [newWorkspaceDesc, setNewWorkspaceDesc] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);
  const [createError, setCreateError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadWorkspaces() {
      setIsLoading(true);
      try {
        const list = await workspaceService.getWorkspaces();
        setWorkspaces(list);
      } catch {
        // Fallback to store
      } finally {
        setIsLoading(false);
      }
    }
    loadWorkspaces();
  }, [setWorkspaces]);

  const handleSelectWorkspace = (slug: string) => {
    const ws = workspaces.find((w) => w.slug === slug);
    if (ws) setCurrentWorkspace(ws);
    router.push(`/${slug}/dashboard`);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    setIsCreating(true);
    setCreateError(null);

    try {
      const created = await workspaceService.createWorkspace({
        name: newWorkspaceName.trim(),
        description: newWorkspaceDesc.trim() || undefined,
      });

      if (created) {
        setWorkspaces([...workspaces, created]);
        setCurrentWorkspace(created);
        setCreateModalOpen(false);
        router.push(`/${created.slug}/dashboard`);
      }
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string | string[] } } };
      const msg = apiErr.response?.data?.message || 'Failed to create workspace. Please try again.';
      setCreateError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight sm:text-3xl">
            Your Workspaces
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Select a project workspace to enter its AI engineering intelligence context.
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)} size="sm" variant="ai" className="text-xs">
          <svg
            className="mr-1.5 h-3.5 w-3.5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="12" x2="12" y1="5" y2="19" />
            <line x1="5" x2="19" y1="12" y2="12" />
          </svg>
          New Workspace
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 space-y-3">
          <LoadingSpinner size="lg" />
          <span className="text-xs text-slate-400 font-mono">Loading workspaces...</span>
        </div>
      ) : workspaces.length === 0 ? (
        <Card className="border border-slate-800 bg-[#0b101f] p-12 text-center space-y-4 rounded-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-2xl">
            🏢
          </div>
          <div className="space-y-1">
            <CardTitle className="text-base font-bold text-white">No Workspaces Found</CardTitle>
            <CardDescription className="text-xs text-slate-400 max-w-sm mx-auto">
              You do not have access to any workspaces yet. Create your first workspace to connect
              repositories.
            </CardDescription>
          </div>
          <Button
            onClick={() => setCreateModalOpen(true)}
            size="sm"
            variant="ai"
            className="text-xs"
          >
            Create First Workspace
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {workspaces.map((ws) => (
            <Card
              key={ws.id || ws.slug}
              interactive
              onClick={() => handleSelectWorkspace(ws.slug)}
              className="p-6 flex flex-col justify-between space-y-4 bg-[#0b101f] border-slate-800/80 rounded-2xl hover:border-blue-500/50 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Avatar
                    fallback={ws.name}
                    size="md"
                    className="bg-blue-950/60 text-blue-400 border border-blue-500/20 font-bold"
                  />
                  <Badge variant="secondary" size="sm" className="font-mono text-[10px]">
                    {ws.role || 'MEMBER'}
                  </Badge>
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                    {ws.name}
                  </CardTitle>
                  <CardDescription className="mt-1 font-mono text-[11px] text-slate-400">
                    /{ws.slug}
                  </CardDescription>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {ws.description || 'Enterprise repository and AI conversation workspace.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono text-[11px]">Enter Workspace</span>
                <span className="text-blue-400 font-bold text-sm">→</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Workspace Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-md bg-[#0b101f] border-slate-800 text-white">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-white">
                Create New Workspace
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Workspaces isolate repositories, embeddings, and chat conversations.
              </DialogDescription>
            </DialogHeader>

            {createError && (
              <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-xs text-rose-300">
                {createError}
              </div>
            )}

            <div className="space-y-3.5 my-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Workspace Name</label>
                <Input
                  placeholder="e.g. Acme Mobile Engineering"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  autoFocus
                  required
                  className="bg-slate-900/60 border-slate-800 focus:border-blue-500 text-white text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Description (Optional)
                </label>
                <Input
                  placeholder="e.g. Core microservices and cloud infrastructure"
                  value={newWorkspaceDesc}
                  onChange={(e) => setNewWorkspaceDesc(e.target.value)}
                  className="bg-slate-900/60 border-slate-800 focus:border-blue-500 text-white text-xs"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="ai"
                size="sm"
                isLoading={isCreating}
                className="text-xs"
              >
                Create Workspace
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
