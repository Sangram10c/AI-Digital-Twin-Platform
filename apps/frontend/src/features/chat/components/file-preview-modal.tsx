'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CodeBlock } from '@/components/shared/code-block';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { knowledgeService } from '@/services/knowledge.service';
import type { Citation } from '@/types/chat.types';

interface FilePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filePath: string | null;
  citation?: Citation | null;
  allCitations?: Citation[];
  repositoryName?: string | null;
  workspaceId?: string;
}

export function FilePreviewModal({
  open,
  onOpenChange,
  filePath,
  citation,
  allCitations = [],
  repositoryName,
  workspaceId,
}: FilePreviewModalProps) {
  const [fetchedCode, setFetchedCode] = React.useState<{ path: string; code: string } | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [copiedPath, setCopiedPath] = React.useState(false);

  const activePath = filePath || citation?.filePath || citation?.title || 'Unknown File';
  const activeRepo = citation?.repositoryName || repositoryName || 'AI-Digital-Twin-Platform';

  const fullCode = open && fetchedCode?.path === activePath ? fetchedCode.code : null;

  // Detect language from file extension
  const getLanguage = (path: string) => {
    if (path.endsWith('.ts') || path.endsWith('.tsx')) return 'typescript';
    if (path.endsWith('.js') || path.endsWith('.jsx')) return 'javascript';
    if (path.endsWith('.json')) return 'json';
    if (path.endsWith('.prisma')) return 'prisma';
    if (path.endsWith('.py')) return 'python';
    if (path.endsWith('.sql')) return 'sql';
    if (path.endsWith('.md')) return 'markdown';
    if (path.endsWith('.yml') || path.endsWith('.yaml')) return 'yaml';
    return 'typescript';
  };

  const language = getLanguage(activePath);
  const fileName = activePath.split('/').pop() || activePath;

  const isNpmPackage = activePath.startsWith('@');
  const externalUrl = isNpmPackage
    ? `https://www.npmjs.com/package/${activePath}`
    : `https://github.com/${activeRepo.includes('/') ? activeRepo : `Sangram10c/${activeRepo}`}/blob/main/${activePath.replace(/^[./\\]+/, '')}`;
  const externalButtonLabel = isNpmPackage ? 'Open in npm' : 'Open in GitHub';

  // Find all citations matching this file path or file basename
  const matchingCitations = React.useMemo(() => {
    if (!activePath) return [];
    const base = fileName.toLowerCase();
    return allCitations.filter((c) => {
      const cPath = (c.filePath || c.title || '').toLowerCase();
      return (
        cPath.endsWith(base) ||
        cPath.includes(activePath.toLowerCase()) ||
        activePath.toLowerCase().includes(cPath)
      );
    });
  }, [activePath, fileName, allCitations]);

  // Combine citation excerpts if available
  const citationExcerpt = React.useMemo(() => {
    if (citation?.excerpt) return citation.excerpt;
    if (matchingCitations.length > 0) {
      return matchingCitations
        .map((c) => c.excerpt)
        .filter(Boolean)
        .join('\n\n// ── Next Chunk ──\n\n');
    }
    return null;
  }, [citation, matchingCitations]);

  // Load document content from backend if workspaceId is available
  React.useEffect(() => {
    if (!open || !activePath) return;

    let isMounted = true;

    async function fetchFullDocument() {
      if (!workspaceId) return;

      setIsLoading(true);
      try {
        // 1. Direct file content query
        const fileResult = await knowledgeService.getFileContent(workspaceId, activePath);
        if (fileResult?.content && isMounted) {
          setFetchedCode({ path: activePath, code: fileResult.content });
          setIsLoading(false);
          return;
        }

        // 2. Fallback to documents list search
        const docs = await knowledgeService.listDocuments(workspaceId, 1, 100);
        const matchedDoc = docs.find((d) => {
          const docPath = (d.filePath || d.title || '').toLowerCase();
          return (
            docPath === activePath.toLowerCase() ||
            docPath.endsWith(fileName.toLowerCase()) ||
            activePath.toLowerCase().endsWith(docPath)
          );
        });

        if (matchedDoc && isMounted) {
          const docDetail = await knowledgeService.getDocument(matchedDoc.id, workspaceId);
          if (
            docDetail &&
            typeof docDetail.rawContent === 'string' &&
            docDetail.rawContent.trim()
          ) {
            setFetchedCode({ path: activePath, code: docDetail.rawContent });
            setIsLoading(false);
            return;
          }
        }
      } catch {
        // Fallback to excerpt
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void fetchFullDocument();

    return () => {
      isMounted = false;
    };
  }, [open, activePath, fileName, workspaceId]);

  const handleCopyPath = async () => {
    try {
      await navigator.clipboard.writeText(activePath);
      setCopiedPath(true);
      setTimeout(() => setCopiedPath(false), 2000);
    } catch {
      // ignore
    }
  };

  const finalCodeToDisplay =
    fullCode ||
    citationExcerpt ||
    `// Grounded reference for ${activePath}\n// File path indexed in repository: ${activeRepo}\n\n// Inspect full contents via the GitHub repository link above.`;

  const totalLines = finalCodeToDisplay.split('\n').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border border-slate-800/90 bg-[#080d1a] shadow-2xl rounded-2xl max-w-4xl p-6 overflow-hidden">
        {/* Header Bar */}
        <DialogHeader className="border-b border-slate-800/80 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 overflow-hidden min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 shadow-inner">
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                  <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                </svg>
              </div>

              <div className="overflow-hidden min-w-0 space-y-0.5">
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-sm sm:text-base font-bold text-white font-mono truncate">
                    {fileName}
                  </DialogTitle>
                  <button
                    type="button"
                    onClick={handleCopyPath}
                    title="Copy full path"
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {copiedPath ? (
                      <span className="text-[10px] text-emerald-400 font-mono">Copied!</span>
                    ) : (
                      <svg
                        className="h-3.5 w-3.5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                      </svg>
                    )}
                  </button>
                </div>

                <DialogDescription className="text-xs text-slate-400 font-mono truncate">
                  {activePath}
                </DialogDescription>
              </div>
            </div>

            {/* Badges and Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-mono text-slate-400 bg-slate-900/80 px-2 py-1 rounded-md border border-slate-800">
                {totalLines} lines
              </span>
              <Badge variant="secondary" size="sm" className="font-mono text-[10px] uppercase">
                {language}
              </Badge>
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 text-xs gap-1.5 border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 shadow-xs cursor-pointer"
                >
                  <svg
                    className="h-3.5 w-3.5 fill-current"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  <span>{externalButtonLabel}</span>
                </Button>
              </a>
            </div>
          </div>
        </DialogHeader>

        {/* Code Content Viewport */}
        <div className="py-3 space-y-2">
          {matchingCitations.length > 0 && !fullCode && (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-blue-950/40 border border-blue-500/20 text-xs">
              <span className="text-slate-300">
                Indexed Grounding Knowledge Excerpt ({matchingCitations.length} chunks)
              </span>
              <span className="font-mono text-emerald-400 text-[11px] font-semibold">
                {(Math.max(...matchingCitations.map((c) => c.relevanceScore)) * 100).toFixed(0)}%
                Match
              </span>
            </div>
          )}

          <div className="relative max-h-[60vh] overflow-y-auto rounded-xl border border-slate-800 bg-[#04060d] shadow-inner">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-16 space-y-2">
                <LoadingSpinner size="md" />
                <span className="text-xs text-slate-400 font-mono">
                  Loading full source code...
                </span>
              </div>
            ) : (
              <CodeBlock
                code={finalCodeToDisplay}
                language={language}
                filename={fileName}
                showLineNumbers={true}
                className="my-0 border-0 bg-transparent"
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
