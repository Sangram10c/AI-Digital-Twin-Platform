'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

export default function RepositoriesPage() {
  const repos = [
    {
      name: 'AI-Digital-Twin-Platform',
      url: 'https://github.com/org/AI-Digital-Twin-Platform',
      branch: 'main',
      commits: 248,
      prs: 14,
      status: 'SYNCED',
      lastSynced: '10 minutes ago',
    },
    {
      name: 'frontend-nextjs',
      url: 'https://github.com/org/frontend-nextjs',
      branch: 'main',
      commits: 86,
      prs: 5,
      status: 'SYNCED',
      lastSynced: '1 hour ago',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">Connected Repositories</h1>
          <p className="text-xs text-muted-foreground">
            Synchronize branches, commits, PR discussions, and documentation into the knowledge
            base.
          </p>
        </div>
        <Button size="sm" variant="ai">
          Connect GitHub Repo
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Repository</TableHead>
            <TableHead>Default Branch</TableHead>
            <TableHead>Commits</TableHead>
            <TableHead>Pull Requests</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Synced</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {repos.map((repo) => (
            <TableRow key={repo.name}>
              <TableCell className="font-semibold text-foreground">
                <div>{repo.name}</div>
                <div className="text-[10px] text-muted-foreground font-mono">{repo.url}</div>
              </TableCell>
              <TableCell className="font-mono text-xs">{repo.branch}</TableCell>
              <TableCell>{repo.commits}</TableCell>
              <TableCell>{repo.prs}</TableCell>
              <TableCell>
                <Badge size="sm" variant="success" dot>
                  {repo.status}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-xs">{repo.lastSynced}</TableCell>
              <TableCell className="text-right">
                <Button size="sm" variant="outline">
                  Trigger Sync
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
