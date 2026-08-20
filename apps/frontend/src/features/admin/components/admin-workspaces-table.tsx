'use client';

import Link from 'next/link';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Workspace } from '@/types/workspace.types';

interface AdminWorkspacesTableProps {
  workspaces: Workspace[];
}

export function AdminWorkspacesTable({ workspaces }: AdminWorkspacesTableProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight">
            Active Workspaces Overview
          </h2>
          <p className="text-xs text-slate-400">
            Registered tenant workspaces, membership roles, and codebase indexing status.
          </p>
        </div>
        <Badge variant="outline" size="sm" className="font-mono text-[10px]">
          {workspaces.length} Registered
        </Badge>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-[#0b101f] overflow-hidden shadow-xl">
        <Table>
          <TableHeader className="bg-slate-900/60 border-b border-slate-800">
            <TableRow>
              <TableHead className="text-slate-400">Workspace</TableHead>
              <TableHead className="text-slate-400">Slug</TableHead>
              <TableHead className="text-slate-400">Operator Role</TableHead>
              <TableHead className="text-right text-slate-400">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workspaces.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="p-8 text-center text-xs text-slate-400">
                  No active workspaces found.
                </TableCell>
              </TableRow>
            ) : (
              workspaces.map((w) => (
                <TableRow key={w.id} className="border-b border-slate-800/60 hover:bg-slate-900/40">
                  <TableCell className="font-semibold text-white">
                    <div>{w.name}</div>
                    {w.description && (
                      <div className="text-[10px] text-slate-400 truncate max-w-xs">
                        {w.description}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-300">{w.slug}</TableCell>
                  <TableCell>
                    <Badge variant="outline" size="sm" className="font-mono text-[9px]">
                      {w.role || 'MEMBER'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/${w.slug}/dashboard`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        Enter Workspace →
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
