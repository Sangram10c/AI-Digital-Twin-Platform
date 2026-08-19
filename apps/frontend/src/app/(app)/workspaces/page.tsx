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
import { useWorkspaceStore } from '@/store/workspace.store';
import type { Workspace } from '@/types/workspace.types';

export default function WorkspacesPage() {
  const router = useRouter();
  const { workspaces, setCurrentWorkspace } = useWorkspaceStore();
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = React.useState('');

  const handleSelectWorkspace = (slug: string) => {
    const ws = workspaces.find((w) => w.slug === slug);
    if (ws) setCurrentWorkspace(ws);
    router.push(`/${slug}/dashboard`);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    const slug = newWorkspaceName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setCreateModalOpen(false);
    router.push(`/${slug}/dashboard`);
  };

  const displayWorkspaces: Workspace[] =
    workspaces.length > 0
      ? workspaces
      : [
          {
            id: 'ws-1',
            name: 'Core Platform Engineering',
            slug: 'core-platform',
            role: 'OWNER',
            description: 'Main backend monorepo, microservices, and AI RAG engine.',
          },
          {
            id: 'ws-2',
            name: 'Frontend Design & UI',
            slug: 'frontend-ui',
            role: 'ADMIN',
            description: 'Next.js application, component design system, and dashboard views.',
          },
        ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">Workspaces</h1>
          <p className="text-xs text-muted-foreground">
            Select a workspace to enter its engineering intelligence context.
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)} size="sm" variant="ai">
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
          Create Workspace
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayWorkspaces.map((ws) => (
          <Card
            key={ws.slug}
            interactive
            onClick={() => handleSelectWorkspace(ws.slug)}
            className="p-5 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Avatar
                  fallback={ws.name}
                  size="md"
                  className="bg-primary/10 text-primary font-bold"
                />
                <Badge variant="secondary" size="sm">
                  {ws.role || 'MEMBER'}
                </Badge>
              </div>
              <div>
                <CardTitle className="text-sm">{ws.name}</CardTitle>
                <CardDescription className="mt-1 font-mono text-[11px]">/{ws.slug}</CardDescription>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {ws.description || 'Enterprise repository and AI conversation workspace.'}
              </p>
            </div>

            <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Enter Workspace</span>
              <span className="text-primary font-bold">→</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Create Workspace Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Create New Workspace</DialogTitle>
              <DialogDescription>
                Workspaces isolate repositories, embeddings, and chat conversations.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 my-4">
              <label className="text-xs font-semibold text-foreground">Workspace Name</label>
              <Input
                placeholder="e.g. Acme Mobile Engineering"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                autoFocus
                required
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="default" size="sm">
                Create Workspace
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
