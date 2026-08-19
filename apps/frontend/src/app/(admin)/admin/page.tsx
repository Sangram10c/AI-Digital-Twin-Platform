'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

export default function AdminOverviewPage() {
  const queues = [
    { name: 'embedding', waiting: 0, active: 0, completed: 1842, failed: 0, status: 'HEALTHY' },
    { name: 'ai-processing', waiting: 0, active: 0, completed: 312, failed: 0, status: 'HEALTHY' },
    { name: 'analytics', waiting: 0, active: 0, completed: 48, failed: 0, status: 'HEALTHY' },
    { name: 'notification', waiting: 0, active: 0, completed: 520, failed: 0, status: 'HEALTHY' },
    { name: 'email', waiting: 0, active: 0, completed: 14, failed: 0, status: 'HEALTHY' },
  ];

  const providers = [
    { provider: 'Google Gemini', model: 'gemini-2.0-flash', latency: '420ms', status: 'ACTIVE' },
    { provider: 'Groq', model: 'llama-3.3-70b-versatile', latency: '210ms', status: 'STANDBY' },
    { provider: 'OpenAI', model: 'gpt-4o-mini', latency: '650ms', status: 'STANDBY' },
    { provider: 'Anthropic', model: 'claude-3-5-sonnet', latency: '820ms', status: 'STANDBY' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">Platform Administration</h1>
        <p className="text-xs text-muted-foreground">
          System telemetry, BullMQ background queues, Redis state, and AI provider status.
        </p>
      </div>

      {/* BullMQ Queues */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">BullMQ Queue Status (Redis ≥ 5.0)</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Queue Name</TableHead>
              <TableHead>Waiting</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Completed</TableHead>
              <TableHead>Failed</TableHead>
              <TableHead className="text-right">Health</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queues.map((q) => (
              <TableRow key={q.name}>
                <TableCell className="font-mono font-semibold">{q.name}</TableCell>
                <TableCell>{q.waiting}</TableCell>
                <TableCell>{q.active}</TableCell>
                <TableCell className="text-success font-semibold">{q.completed}</TableCell>
                <TableCell className={q.failed > 0 ? 'text-destructive font-semibold' : ''}>
                  {q.failed}
                </TableCell>
                <TableCell className="text-right">
                  <Badge size="sm" variant="success" dot>
                    {q.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* AI Providers */}
      <div className="space-y-3 pt-4">
        <h2 className="text-sm font-semibold text-foreground">AI Provider Abstraction Layer</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {providers.map((p) => (
            <Card key={p.provider} className="p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">{p.provider}</span>
                <Badge size="sm" variant={p.status === 'ACTIVE' ? 'ai' : 'secondary'}>
                  {p.status}
                </Badge>
              </div>
              <div className="text-xs font-mono text-muted-foreground truncate">{p.model}</div>
              <div className="text-[11px] text-muted-foreground">Avg Latency: {p.latency}</div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
