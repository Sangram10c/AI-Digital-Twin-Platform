'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface DangerZoneProps {
  workspaceName: string;
  workspaceSlug: string;
  isOwner: boolean;
  onDeleteWorkspace: () => void;
  isDeleting: boolean;
}

export function DangerZone({
  workspaceName,
  workspaceSlug,
  isOwner,
  onDeleteWorkspace,
  isDeleting,
}: DangerZoneProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [confirmationInput, setConfirmationInput] = React.useState('');

  const isConfirmed = confirmationInput === workspaceSlug;

  const handleDelete = () => {
    if (!isConfirmed) return;
    onDeleteWorkspace();
  };

  return (
    <Card className="border border-rose-900/50 bg-[#12070a] p-6 rounded-2xl shadow-xl space-y-4">
      <CardHeader className="p-0">
        <CardTitle className="text-base font-bold text-rose-300">Danger Zone</CardTitle>
        <CardDescription className="text-xs text-rose-400/80">
          Irreversible actions affecting the entire workspace, members, repositories, and
          embeddings.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0 pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h4 className="text-xs font-bold text-white">Delete this workspace</h4>
          <p className="text-[11px] text-slate-400 max-w-md">
            Permanently delete <span className="font-semibold text-white">{workspaceName}</span>,
            all indexed vector chunks, conversations, and member associations.
          </p>
        </div>

        <Button
          variant="destructive"
          size="sm"
          disabled={!isOwner}
          onClick={() => setIsDeleteDialogOpen(true)}
          className="text-xs whitespace-nowrap shrink-0"
        >
          {isOwner ? 'Delete Workspace' : 'Owner Only'}
        </Button>
      </CardContent>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="border border-rose-900/80 bg-[#0d0407] rounded-2xl max-w-md p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-base font-bold text-rose-400">
              Confirm Workspace Deletion
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 leading-relaxed">
              This action cannot be undone. To confirm, please type the workspace slug{' '}
              <span className="font-mono font-bold text-white bg-slate-900 px-1.5 py-0.5 rounded">
                {workspaceSlug}
              </span>{' '}
              below:
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <Input
              value={confirmationInput}
              onChange={(e) => setConfirmationInput(e.target.value)}
              placeholder={workspaceSlug}
              className="bg-slate-950 border-rose-900/60 text-xs font-mono text-white"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={!isConfirmed || isDeleting}
              onClick={handleDelete}
              className="text-xs"
            >
              {isDeleting ? 'Deleting...' : 'Permanently Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
