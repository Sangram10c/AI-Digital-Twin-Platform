'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useWorkspaceStore } from '@/store/workspace.store';
import { usePermissions } from '@/hooks/use-permissions';
import { workspaceService } from '@/services/workspace.service';
import { WorkspaceRole, WorkspaceMember } from '@/types/workspace.types';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { PageHeader } from '@/components/shared/page-header';
import { ForbiddenState } from '@/components/shared/forbidden-state';

export default function WorkspaceMembersPage() {
  const params = useParams();
  const queryClient = useQueryClient();
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

  // Invite modal state
  const [inviteModalOpen, setInviteModalOpen] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState('');
  const [inviteRole, setInviteRole] = React.useState<WorkspaceRole>(WorkspaceRole.MEMBER);
  const [inviteError, setInviteError] = React.useState<string | null>(null);

  // Remove confirmation modal state
  const [memberToRemove, setMemberToRemove] = React.useState<WorkspaceMember | null>(null);

  // Fetch real workspace members
  const { data: members = [], isLoading } = useQuery({
    queryKey: ['workspace', workspaceId, 'members'],
    queryFn: () => workspaceService.getMembers(workspaceId),
    enabled: Boolean(workspaceId && workspaceId !== 'default'),
  });

  // Invite mutation
  const inviteMutation = useMutation({
    mutationFn: async () => {
      setInviteError(null);
      return workspaceService.inviteMember(workspaceId, {
        email: inviteEmail.trim(),
        role: inviteRole,
      });
    },
    onSuccess: () => {
      setInviteModalOpen(false);
      setInviteEmail('');
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId, 'members'] });
    },
    onError: (err: unknown) => {
      const apiErr = err as { response?: { data?: { message?: string | string[] } } };
      const msg = apiErr.response?.data?.message || 'Failed to invite member. Please check email.';
      setInviteError(Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  // Role update mutation
  const roleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: WorkspaceRole }) => {
      return workspaceService.updateMemberRole(workspaceId, memberId, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId, 'members'] });
    },
    onError: (err) => {
      console.error('Failed to update role', err);
    },
  });

  // Remove member mutation
  const removeMutation = useMutation({
    mutationFn: async (memberId: string) => {
      return workspaceService.removeMember(workspaceId, memberId);
    },
    onSuccess: () => {
      setMemberToRemove(null);
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId, 'members'] });
    },
    onError: (err) => {
      console.error('Failed to remove member', err);
    },
  });

  const canManageMembers = isOwner || isAdmin || can('members.manage') || can('workspace.manage');

  const getRoleBadgeVariant = (role: WorkspaceRole) => {
    switch (role) {
      case WorkspaceRole.OWNER:
        return 'ai';
      case WorkspaceRole.ADMIN:
        return 'default';
      case WorkspaceRole.MEMBER:
        return 'secondary';
      case WorkspaceRole.VIEWER:
        return 'outline';
      default:
        return 'secondary';
    }
  };

  if (!can('members.read') && !isAdmin && !isLoading) {
    return (
      <ForbiddenState
        title="Workspace Members Restricted"
        description="You do not have permission to view or manage members for this workspace."
        backHref={`/${slug}/dashboard`}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-5xl pb-16">
      <PageHeader
        title="Members & Roles"
        description="Manage workspace team members, invite developers, and configure granular authorization roles."
        badge={
          <Badge variant="outline" className="font-mono text-[10px]">
            {members.length} {members.length === 1 ? 'Member' : 'Members'}
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/${slug}/settings`}>
              <Button variant="outline" size="sm" className="text-xs">
                ← Workspace Settings
              </Button>
            </Link>
            {canManageMembers && (
              <Button
                variant="ai"
                size="sm"
                onClick={() => setInviteModalOpen(true)}
                className="text-xs gap-1.5"
              >
                <svg
                  className="h-3.5 w-3.5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="19" x2="19" y1="8" y2="14" />
                  <line x1="22" x2="16" y1="11" y2="11" />
                </svg>
                <span>Invite Member</span>
              </Button>
            )}
          </div>
        }
      />

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 space-y-3">
          <LoadingSpinner size="lg" />
          <span className="text-xs text-slate-400 font-mono">Loading workspace members...</span>
        </div>
      ) : members.length === 0 ? (
        <Card className="border border-slate-800 bg-[#0b101f] p-12 text-center rounded-2xl shadow-xl space-y-3">
          <div className="text-3xl">👥</div>
          <CardTitle className="text-base font-bold text-white">No Members Found</CardTitle>
          <CardDescription className="text-xs text-slate-400 max-w-sm mx-auto">
            Invite your team members to collaborate on repository intelligence and shared AI chat
            sessions.
          </CardDescription>
          {canManageMembers && (
            <Button
              variant="ai"
              size="sm"
              onClick={() => setInviteModalOpen(true)}
              className="text-xs mt-2"
            >
              Invite First Member
            </Button>
          )}
        </Card>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-[#0b101f] overflow-hidden shadow-xl">
          <Table>
            <TableHeader className="bg-slate-900/60 border-b border-slate-800">
              <TableRow>
                <TableHead className="text-slate-400">Member</TableHead>
                <TableHead className="text-slate-400">Role</TableHead>
                <TableHead className="text-slate-400">Joined</TableHead>
                {canManageMembers && (
                  <TableHead className="text-right text-slate-400">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const isMemberOwner = member.role === WorkspaceRole.OWNER;
                return (
                  <TableRow
                    key={member.id || member.userId}
                    className="border-b border-slate-800/60 hover:bg-slate-900/40"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar
                          fallback={member.displayName || member.email}
                          className="h-8 w-8 text-xs bg-slate-800 border border-slate-700 text-slate-300 font-bold"
                        />
                        <div>
                          <div className="font-semibold text-xs text-white">
                            {member.displayName || member.email.split('@')[0]}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">{member.email}</div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      {canManageMembers && !isMemberOwner ? (
                        <Select
                          value={member.role}
                          onChange={(e) =>
                            roleMutation.mutate({
                              memberId: member.id,
                              role: e.target.value as WorkspaceRole,
                            })
                          }
                          className="h-7 text-xs w-32 bg-slate-900 border-slate-800"
                          options={[
                            { value: WorkspaceRole.ADMIN, label: 'ADMIN' },
                            { value: WorkspaceRole.MEMBER, label: 'MEMBER' },
                            { value: WorkspaceRole.VIEWER, label: 'VIEWER' },
                          ]}
                        />
                      ) : (
                        <Badge
                          size="sm"
                          variant={getRoleBadgeVariant(member.role)}
                          className="font-mono text-[10px]"
                        >
                          {member.role}
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-xs text-slate-400 font-mono">
                      {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : 'Active'}
                    </TableCell>

                    {canManageMembers && (
                      <TableCell className="text-right">
                        {!isMemberOwner && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setMemberToRemove(member)}
                            className="h-7 text-xs text-rose-400 hover:bg-rose-950/40 hover:text-rose-300"
                          >
                            Remove
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Invite Member Dialog */}
      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent className="max-w-md bg-[#0b101f] border-slate-800 text-white rounded-2xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (inviteEmail.trim()) inviteMutation.mutate();
            }}
          >
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-white">
                Invite Team Member
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Grant access to {activeWorkspace.name} with workspace-scoped permissions.
              </DialogDescription>
            </DialogHeader>

            {inviteError && (
              <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-xs text-rose-300">
                {inviteError}
              </div>
            )}

            <div className="space-y-3.5 my-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Member Email</label>
                <Input
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  autoFocus
                  className="bg-slate-900 border-slate-800 text-white text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Workspace Role</label>
                <Select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as WorkspaceRole)}
                  options={[
                    {
                      value: WorkspaceRole.ADMIN,
                      label: 'ADMIN — Full workspace & repo management',
                    },
                    {
                      value: WorkspaceRole.MEMBER,
                      label: 'MEMBER — Query code, chat, view timeline',
                    },
                    { value: WorkspaceRole.VIEWER, label: 'VIEWER — Read-only code intelligence' },
                  ]}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setInviteModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="ai"
                size="sm"
                disabled={inviteMutation.isPending || !inviteEmail.trim()}
                className="text-xs"
              >
                {inviteMutation.isPending ? 'Inviting...' : 'Send Invitation'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation Dialog */}
      <Dialog
        open={Boolean(memberToRemove)}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
      >
        <DialogContent className="max-w-sm bg-[#0b101f] border-slate-800 text-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-400">Remove Member</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Are you sure you want to remove{' '}
              <span className="font-semibold text-white">{memberToRemove?.email}</span> from this
              workspace? They will lose access immediately.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMemberToRemove(null)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              disabled={removeMutation.isPending}
              onClick={() => memberToRemove && removeMutation.mutate(memberToRemove.id)}
              className="bg-rose-600 hover:bg-rose-500 text-white text-xs"
            >
              {removeMutation.isPending ? 'Removing...' : 'Remove Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
