'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatService } from '@/services/chat.service';
import type { Conversation } from '@/types/chat.types';

export function useConversations(workspaceId: string | undefined, searchQuery = '') {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['conversations', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const res = await chatService.listConversations(workspaceId);
      return res.data || [];
    },
    enabled: Boolean(workspaceId),
    staleTime: 1000 * 30, // 30s
  });

  const conversations: Conversation[] = query.data || [];

  // Filter conversations by title or repository name
  const filteredConversations = searchQuery.trim()
    ? conversations.filter((c) => {
        const title = c.title || 'New Conversation';
        const repo = c.repositoryName || '';
        const term = searchQuery.toLowerCase();
        return title.toLowerCase().includes(term) || repo.toLowerCase().includes(term);
      })
    : conversations;

  // Group conversations by relative time
  const groupedConversations = React_groupConversationsByTime(filteredConversations);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => chatService.deleteConversation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', workspaceId] });
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      chatService.updateTitle(id, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', workspaceId] });
    },
  });

  const pinMutation = useMutation({
    mutationFn: ({ id, isPinned }: { id: string; isPinned: boolean }) =>
      isPinned ? chatService.unpinConversation(id) : chatService.pinConversation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', workspaceId] });
    },
  });

  return {
    conversations: filteredConversations,
    groupedConversations,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    deleteConversation: deleteMutation.mutateAsync,
    renameConversation: renameMutation.mutateAsync,
    togglePinConversation: pinMutation.mutateAsync,
  };
}

function React_groupConversationsByTime(conversations: Conversation[]) {
  const groups: {
    today: Conversation[];
    yesterday: Conversation[];
    previous7Days: Conversation[];
    older: Conversation[];
  } = {
    today: [],
    yesterday: [],
    previous7Days: [],
    older: [],
  };

  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000;

  conversations.forEach((conv) => {
    const date = new Date(conv.updatedAt || conv.createdAt);
    const diffDays = Math.floor((now.getTime() - date.getTime()) / oneDay);

    if (diffDays === 0) {
      groups.today.push(conv);
    } else if (diffDays === 1) {
      groups.yesterday.push(conv);
    } else if (diffDays <= 7) {
      groups.previous7Days.push(conv);
    } else {
      groups.older.push(conv);
    }
  });

  return groups;
}
