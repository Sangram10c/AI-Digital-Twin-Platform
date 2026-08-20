'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Conversation } from '@/types/chat.types';

interface RecentConversationsProps {
  conversations: Conversation[];
  slug: string;
}

export function RecentConversations({ conversations, slug }: RecentConversationsProps) {
  return (
    <Card className="border border-slate-800 bg-[#0b101f] p-6 rounded-2xl shadow-xl space-y-4">
      <CardHeader className="p-0 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-bold text-white">Recent Conversations</CardTitle>
          <CardDescription className="text-xs text-slate-400">
            RAG chat sessions grounded in indexed codebase knowledge.
          </CardDescription>
        </div>
        <Link href={`/${slug}/chat`}>
          <Button variant="ghost" size="sm" className="text-xs text-blue-400 hover:text-blue-300">
            All Chats →
          </Button>
        </Link>
      </CardHeader>

      <CardContent className="p-0 pt-2 space-y-2.5">
        {conversations.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-slate-800 bg-slate-900/30 text-center space-y-2">
            <p className="text-xs text-slate-400">
              No chat sessions started in this workspace yet.
            </p>
            <Link href={`/${slug}/chat`}>
              <Button variant="ai" size="sm" className="text-xs">
                Start First Conversation
              </Button>
            </Link>
          </div>
        ) : (
          conversations.slice(0, 4).map((c) => (
            <Link key={c.id} href={`/${slug}/chat/${c.id}`} className="block">
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/40 hover:border-slate-700 transition-colors group">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-950/60 border border-blue-500/20 text-blue-400 text-xs shrink-0">
                    💬
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-xs text-white truncate group-hover:text-blue-400 transition-colors">
                      {c.title || 'Untitled Conversation'}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : 'Recent'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <Badge variant="secondary" size="sm" className="font-mono text-[10px]">
                    {c.messageCount || 0} msgs
                  </Badge>
                  <span className="text-slate-400 group-hover:text-white transition-colors text-xs">
                    →
                  </span>
                </div>
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
