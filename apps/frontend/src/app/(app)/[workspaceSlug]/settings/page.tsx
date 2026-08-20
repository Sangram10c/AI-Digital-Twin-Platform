'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useWorkspaceStore } from '@/store/workspace.store';
import { usePermissions } from '@/hooks/use-permissions';
import { workspaceService } from '@/services/workspace.service';
import { Workspace } from '@/types/workspace.types';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { PageHeader } from '@/components/shared/page-header';
import { ForbiddenState } from '@/components/shared/forbidden-state';
import {
  AiProviderSettings,
  NotificationSettings,
  AppearanceSettings,
  DangerZone,
  NotificationPreferences,
} from '@/features/settings';

export default function WorkspaceSettingsPage() {
  const params = useParams();
  const slug = (params?.workspaceSlug as string) || 'default';
  const { currentWorkspace, workspaces } = useWorkspaceStore();
  const { isOwner, isAdmin, can } = usePermissions();

  const activeWorkspace = currentWorkspace ||
    workspaces.find((w) => w.slug === slug) || {
      id: 'default',
      name: slug,
      slug,
      role: 'OWNER',
    };

  const workspaceId = activeWorkspace.id;

  // Fetch real workspace settings from backend
  const { data: workspaceData, isLoading } = useQuery({
    queryKey: ['workspace', workspaceId, 'details'],
    queryFn: () => workspaceService.getWorkspaceById(workspaceId),
    enabled: Boolean(workspaceId && workspaceId !== 'default'),
  });

  const canManage = isOwner || isAdmin || can('workspace.manage');

  if (!canManage && !isLoading) {
    return (
      <ForbiddenState
        title="Workspace Settings Restricted"
        description="Only workspace Owners and Admins can view and modify settings for this workspace."
        backHref={`/${slug}/dashboard`}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-3">
        <LoadingSpinner size="lg" />
        <span className="text-xs text-slate-400 font-mono">Loading settings...</span>
      </div>
    );
  }

  return (
    <WorkspaceSettingsContent workspace={workspaceData || activeWorkspace} isOwner={isOwner} />
  );
}

function WorkspaceSettingsContent({
  workspace,
  isOwner,
}: {
  workspace: Workspace;
  isOwner: boolean;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { workspaces, setCurrentWorkspace, setWorkspaces } = useWorkspaceStore();

  const workspaceId = workspace.id;
  const slug = workspace.slug;

  const [activeTab, setActiveTab] = React.useState('general');
  const [name, setName] = React.useState(workspace.name || '');
  const [description, setDescription] = React.useState(workspace.description || '');
  const [aiProvider, setAiProvider] = React.useState(
    workspace.settings?.defaultAiProvider || 'gemini',
  );
  const [autoSync, setAutoSync] = React.useState(workspace.settings?.autoSyncEnabled ?? true);
  const [theme, setTheme] = React.useState('dark');
  const [notificationPrefs, setNotificationPrefs] = React.useState<NotificationPreferences>({
    repositorySync: true,
    knowledgeProcessing: true,
    aiCompletion: true,
    jobFailures: true,
    weeklyDigest: false,
  });

  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  // Update general settings mutation
  const updateGeneralMutation = useMutation({
    mutationFn: async () => {
      setSaveError(null);
      setSaveSuccess(false);

      const updated = await workspaceService.updateWorkspace(workspaceId, {
        name: name.trim(),
        description: description.trim() || undefined,
      });

      await workspaceService.updateSettings(workspaceId, {
        defaultAiProvider: aiProvider,
        autoSyncEnabled: autoSync,
      });

      return updated;
    },
    onSuccess: (updated) => {
      setSaveSuccess(true);
      if (updated) {
        setCurrentWorkspace({ ...workspace, ...updated });
        setWorkspaces(workspaces.map((w) => (w.id === workspaceId ? { ...w, ...updated } : w)));
      }
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] });
      setTimeout(() => setSaveSuccess(false), 3000);
    },
    onError: (err: unknown) => {
      const apiErr = err as { response?: { data?: { message?: string | string[] } } };
      const msg = apiErr.response?.data?.message || 'Failed to save workspace settings.';
      setSaveError(Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  // Delete workspace mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await workspaceService.deleteWorkspace(workspaceId);
    },
    onSuccess: () => {
      queryClient.removeQueries();
      const remaining = workspaces.filter((w) => w.id !== workspaceId);
      setWorkspaces(remaining);
      if (remaining.length > 0) {
        setCurrentWorkspace(remaining[0]);
        router.push(`/${remaining[0].slug}/dashboard`);
      } else {
        setCurrentWorkspace(null);
        router.push('/workspaces');
      }
    },
    onError: (err) => {
      console.error('Failed to delete workspace', err);
    },
  });

  return (
    <div className="space-y-6 max-w-4xl pb-16">
      <PageHeader
        title="Workspace Settings"
        description="Configure workspace identity, team permissions, AI LLM models, and ingestion preferences."
        badge={
          <Badge variant="outline" className="font-mono text-[10px]">
            {workspace.role || 'MEMBER'}
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/${slug}/settings/integrations`}>
              <Button variant="outline" size="sm" className="text-xs">
                Integrations →
              </Button>
            </Link>
            <Link href={`/${slug}/settings/members`}>
              <Button variant="outline" size="sm" className="text-xs">
                Members & Roles →
              </Button>
            </Link>
          </div>
        }
      />

      {saveSuccess && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3.5 text-xs text-emerald-300 flex items-center gap-2">
          <span>✓</span>
          <span>Workspace settings saved successfully.</span>
        </div>
      )}

      {saveError && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-3.5 text-xs text-rose-300">
          {saveError}
        </div>
      )}

      {/* Tabs Layout for Settings Sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-900 border border-slate-800 h-9 p-0.5 rounded-xl flex-wrap">
          <TabsTrigger value="general" className="text-xs px-3 h-8">
            General
          </TabsTrigger>
          <TabsTrigger value="ai" className="text-xs px-3 h-8">
            AI Providers
          </TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs px-3 h-8">
            Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance" className="text-xs px-3 h-8">
            Appearance
          </TabsTrigger>
          <TabsTrigger value="danger" className="text-xs px-3 h-8 text-rose-400">
            Danger Zone
          </TabsTrigger>
        </TabsList>

        {/* 1. General Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card className="border border-slate-800 bg-[#0b101f] p-6 rounded-2xl shadow-xl space-y-4">
            <CardHeader className="p-0">
              <CardTitle className="text-base font-bold text-white">General Information</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Workspace display name and unique URL slug identifier.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0 space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Workspace Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Acme Engineering"
                    className="bg-slate-900 border-slate-800 text-white text-xs h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Workspace Slug</label>
                  <Input
                    value={workspace.slug}
                    disabled
                    className="bg-slate-900/40 border-slate-800 text-slate-400 font-mono text-xs h-9 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Description</label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Primary codebase and engineering context"
                  className="bg-slate-900 border-slate-800 text-white text-xs h-9"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-white">
                    Automated Background Sync
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Automatically poll GitHub webhooks and trigger repository re-indexing on new
                    commits.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => setAutoSync(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-0"
                />
              </div>
            </CardContent>

            <CardFooter className="p-0 pt-4 flex justify-end border-t border-slate-800">
              <Button
                variant="ai"
                size="sm"
                disabled={updateGeneralMutation.isPending}
                onClick={() => updateGeneralMutation.mutate()}
                className="text-xs"
              >
                {updateGeneralMutation.isPending ? 'Saving...' : 'Save Settings'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* 2. AI Providers Tab */}
        <TabsContent value="ai" className="space-y-6">
          <AiProviderSettings
            defaultProvider={aiProvider}
            onDefaultProviderChange={(p) => {
              setAiProvider(p);
              updateGeneralMutation.mutate();
            }}
          />
        </TabsContent>

        {/* 3. Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <NotificationSettings preferences={notificationPrefs} onChange={setNotificationPrefs} />
        </TabsContent>

        {/* 4. Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <AppearanceSettings theme={theme} onThemeChange={setTheme} />
        </TabsContent>

        {/* 5. Danger Zone Tab */}
        <TabsContent value="danger" className="space-y-6">
          <DangerZone
            workspaceName={workspace.name}
            workspaceSlug={workspace.slug}
            isOwner={isOwner}
            isDeleting={deleteMutation.isPending}
            onDeleteWorkspace={() => deleteMutation.mutate()}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
