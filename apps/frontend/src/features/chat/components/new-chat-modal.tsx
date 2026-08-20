'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RepositorySelector } from './repository-selector';
import type { Repository } from '@/services/repository.service';

interface NewChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  onStartChat: (repo: Repository | null) => void;
}

export function NewChatModal({ open, onOpenChange, workspaceId, onStartChat }: NewChatModalProps) {
  const [selectedRepo, setSelectedRepo] = React.useState<Repository | null>(null);

  const handleStart = () => {
    onStartChat(selectedRepo);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border border-slate-800/90 bg-[#0b101f] shadow-2xl rounded-2xl max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
            <span>Start New AI Conversation</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400">
            Select a target repository to scope AI semantic search and grounded answers, or search
            all workspace repositories.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <RepositorySelector
            workspaceId={workspaceId}
            selectedRepoId={selectedRepo?.id || null}
            onSelectRepo={setSelectedRepo}
          />
        </div>

        <DialogFooter className="pt-2 border-t border-slate-800 flex justify-between items-center sm:justify-between">
          <div className="text-[11px] text-slate-400 font-mono">
            {selectedRepo ? `Scoped to: ${selectedRepo.name}` : 'Scope: Entire Workspace'}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" variant="ai" size="sm" onClick={handleStart}>
              Start Conversation
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
