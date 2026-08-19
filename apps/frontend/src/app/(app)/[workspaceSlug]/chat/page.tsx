'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MarkdownRenderer } from '@/components/shared/markdown-renderer';

export default function ChatPage() {
  const [input, setInput] = React.useState('');
  const [messages, setMessages] = React.useState([
    {
      role: 'assistant',
      content:
        'Hello! I am your **AI Engineering Digital Twin**. I am grounded in your synchronized repositories, commits, PR discussions, and technical documentation.\n\nYou can ask me questions like:\n- *Which commit introduced the JWT authentication module?*\n- *Explain how hybrid search ranking with RRF works.*\n- *Summarize the changes merged in the last sprint.*',
      citations: [
        {
          number: 1,
          sourceType: 'FILE' as const,
          title: 'auth.service.ts',
          path: 'apps/backend/src/modules/auth/auth.service.ts',
          relevanceScore: 0.95,
        },
        {
          number: 2,
          sourceType: 'PULL_REQUEST' as const,
          title: 'PR #13 - Analytics & Insights Module',
          path: 'pull_requests/13',
          relevanceScore: 0.88,
        },
      ],
    },
  ]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: 'user', content: input, citations: [] };
    const simulatedReply = {
      role: 'assistant',
      content: `I retrieved the relevant knowledge chunks for "${input}". Here is the engineering explanation based on the indexed codebase:`,
      citations: [
        {
          number: 1,
          sourceType: 'FILE' as const,
          title: 'search.service.ts',
          path: 'apps/backend/src/modules/search/search.service.ts',
          relevanceScore: 0.92,
        },
      ],
    };

    setMessages((prev) => [...prev, userMsg, simulatedReply]);
    setInput('');
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h1 className="text-lg font-bold text-foreground sm:text-xl flex items-center gap-2">
            <span>AI Engineering Assistant</span>
            <Badge variant="ai" size="sm">
              10-Step RAG
            </Badge>
          </h1>
          <p className="text-xs text-muted-foreground">
            SSE Streaming chat grounded in repository knowledge chunks and citations.
          </p>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <Card
              className={`max-w-2xl p-4 text-xs ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground border-transparent'
                  : 'bg-card text-card-foreground border-border'
              }`}
            >
              {msg.role === 'assistant' ? (
                <MarkdownRenderer content={msg.content} citations={msg.citations} />
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </Card>
          </div>
        ))}
      </div>

      {/* Prompt Input Bar */}
      <form onSubmit={handleSend} className="flex gap-2 pt-2 border-t border-border">
        <Input
          placeholder="Ask a question about your architecture, commits, or codebase..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" variant="ai" size="md">
          Send
        </Button>
      </form>
    </div>
  );
}
