'use client';

import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { analyticsService } from '@/services/analytics.service';
import { useWorkspaceStore } from '@/store/workspace.store';
import {
  AdminSystemHealth,
  AdminQueuesTable,
  AdminProvidersGrid,
  AdminWorkspacesTable,
  AdminSkeleton,
} from '@/features/admin';

export default function AdminOverviewPage() {
  const { currentWorkspace, workspaces } = useWorkspaceStore();
  const workspaceId =
    currentWorkspace?.id || (workspaces.length > 0 ? workspaces[0].id : 'default');

  // Real health and readiness probes from NestJS /health and /ready
  const { data: health, isLoading: isHealthLoading } = useQuery({
    queryKey: ['admin', 'health'],
    queryFn: () => adminService.getHealth(),
  });

  const { data: readiness, isLoading: isReadinessLoading } = useQuery({
    queryKey: ['admin', 'readiness'],
    queryFn: () => adminService.getReadiness(),
  });

  // Real BullMQ job telemetry
  const { data: jobs, isLoading: isJobsLoading } = useQuery({
    queryKey: ['admin', 'jobs', workspaceId],
    queryFn: () => analyticsService.getJobs(workspaceId),
    enabled: Boolean(workspaceId && workspaceId !== 'default'),
  });

  // Real AI provider metrics
  const { data: ai, isLoading: isAiLoading } = useQuery({
    queryKey: ['admin', 'ai', workspaceId],
    queryFn: () => analyticsService.getAi(workspaceId),
    enabled: Boolean(workspaceId && workspaceId !== 'default'),
  });

  const isLoading = isHealthLoading && isReadinessLoading && isJobsLoading && isAiLoading;

  if (isLoading) {
    return <AdminSkeleton />;
  }

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Header */}
      <div className="space-y-1 pb-4 border-b border-slate-800/80">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Platform Operations & Telemetry
        </h1>
        <p className="text-xs text-slate-400">
          Infrastructure health, BullMQ background queues, pgvector embedding pipelines, and AI
          provider routing.
        </p>
      </div>

      {/* 2. System Infrastructure Health */}
      <AdminSystemHealth health={health} readiness={readiness} />

      {/* 3. BullMQ Queues Status Table */}
      <AdminQueuesTable jobs={jobs} />

      {/* 4. AI Provider Abstraction Layer */}
      <AdminProvidersGrid ai={ai} />

      {/* 5. Registered Workspaces Overview */}
      <AdminWorkspacesTable workspaces={workspaces} />
    </div>
  );
}
