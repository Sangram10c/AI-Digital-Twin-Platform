'use client';

import * as React from 'react';
import { cn } from '@/utils/cn';
import { CodeBlock } from './code-block';
import { CitationBadge, type CitationProps } from './citation-badge';

export interface MarkdownRendererProps {
  content: string;
  citations?: CitationProps[];
  onCitationClick?: (citation: CitationProps) => void;
  onFileClick?: (filePath: string) => void;
  className?: string;
}

type Block =
  | { type: 'heading'; level: number; text: string }
  | { type: 'code'; code: string; language: string; filename?: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'quote'; text: string }
  | { type: 'hr' }
  | { type: 'paragraph'; text: string };

export function MarkdownRenderer({
  content,
  citations = [],
  onCitationClick,
  onFileClick,
  className,
}: MarkdownRendererProps) {
  // Clean raw trailing bracket citations like "[^9]:" or "[9]" from lines if needed
  const sanitizedContent = React.useMemo(() => {
    return content;
  }, [content]);

  // Parse Markdown text into structured blocks
  const blocks = React.useMemo(() => {
    const rawLines = sanitizedContent.split('\n');
    const result: Block[] = [];
    let i = 0;

    while (i < rawLines.length) {
      const line = rawLines[i];
      const trimmed = line.trim();

      // 1. Fenced Code Block: ```lang
      if (trimmed.startsWith('```')) {
        const lang = trimmed.slice(3).trim() || 'typescript';
        const codeLines: string[] = [];
        i++;
        while (i < rawLines.length && !rawLines[i].trim().startsWith('```')) {
          codeLines.push(rawLines[i]);
          i++;
        }
        if (i < rawLines.length && rawLines[i].trim().startsWith('```')) {
          i++; // Consume closing ```
        }
        result.push({
          type: 'code',
          code: codeLines.join('\n'),
          language: lang,
        });
        continue;
      }

      // 2. Horizontal Rule (---, ***, ___)
      if (/^(?:---|\*\*\*|___)$/.test(trimmed)) {
        result.push({ type: 'hr' });
        i++;
        continue;
      }

      // 3. Headings (#, ##, ###, ####)
      const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
      if (headingMatch) {
        result.push({
          type: 'heading',
          level: headingMatch[1].length,
          text: headingMatch[2],
        });
        i++;
        continue;
      }

      // 4. Blockquotes (> text)
      if (trimmed.startsWith('>')) {
        const quoteLines: string[] = [];
        while (i < rawLines.length && rawLines[i].trim().startsWith('>')) {
          quoteLines.push(rawLines[i].trim().replace(/^>\s?/, ''));
          i++;
        }
        result.push({
          type: 'quote',
          text: quoteLines.join('\n'),
        });
        continue;
      }

      // 5. Markdown Tables (| col | col |)
      if (trimmed.startsWith('|') && trimmed.endsWith('|') && i + 1 < rawLines.length) {
        const nextTrimmed = rawLines[i + 1].trim();
        if (nextTrimmed.startsWith('|') && nextTrimmed.includes('---')) {
          const parseRow = (rowStr: string) =>
            rowStr
              .split('|')
              .slice(1, -1)
              .map((c) => c.trim());

          const headers = parseRow(trimmed);
          const rows: string[][] = [];
          i += 2; // skip header + separator line

          while (i < rawLines.length && rawLines[i].trim().startsWith('|')) {
            rows.push(parseRow(rawLines[i].trim()));
            i++;
          }

          result.push({
            type: 'table',
            headers,
            rows,
          });
          continue;
        }
      }

      // 6. Ordered List (1. item)
      if (/^\d+\.\s+/.test(trimmed)) {
        const items: string[] = [];
        while (i < rawLines.length && /^\d+\.\s+/.test(rawLines[i].trim())) {
          items.push(rawLines[i].trim().replace(/^\d+\.\s+/, ''));
          i++;
        }
        result.push({
          type: 'list',
          ordered: true,
          items,
        });
        continue;
      }

      // 7. Unordered List (- item or * item)
      if (/^[-*+]\s+/.test(trimmed)) {
        const items: string[] = [];
        while (i < rawLines.length && /^[-*+]\s+/.test(rawLines[i].trim())) {
          items.push(rawLines[i].trim().replace(/^[-*+]\s+/, ''));
          i++;
        }
        result.push({
          type: 'list',
          ordered: false,
          items,
        });
        continue;
      }

      // 8. Empty line separator
      if (!trimmed) {
        i++;
        continue;
      }

      // 9. Standard Paragraph (accumulate adjacent lines)
      const paragraphLines: string[] = [];
      while (
        i < rawLines.length &&
        rawLines[i].trim() &&
        !rawLines[i].trim().startsWith('```') &&
        !rawLines[i].trim().startsWith('#') &&
        !rawLines[i].trim().startsWith('>') &&
        !rawLines[i].trim().startsWith('|') &&
        !/^\d+\.\s+/.test(rawLines[i].trim()) &&
        !/^[-*+]\s+/.test(rawLines[i].trim()) &&
        !/^(?:---|\*\*\*|___)$/.test(rawLines[i].trim())
      ) {
        paragraphLines.push(rawLines[i]);
        i++;
      }

      if (paragraphLines.length > 0) {
        result.push({
          type: 'paragraph',
          text: paragraphLines.join(' '),
        });
      }
    }

    return result;
  }, [sanitizedContent]);

  // Check if string is a valid file path (exclude npm packages like @prisma/client)
  const isFilePath = (str: string) => {
    const trimmed = str.trim();
    if (trimmed.startsWith('@')) return false;
    const hasKnownExtension =
      /\.(?:ts|tsx|js|jsx|json|prisma|py|go|java|rs|yml|yaml|md|html|css|sql|env|dockerfile)$/i.test(
        trimmed,
      );
    const isStandardRepoPath =
      /^(?:apps|packages|src|prisma|scripts|config|test|tests|\.specify|\.github)\/[a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]+$/i.test(
        trimmed,
      );
    return hasKnownExtension || isStandardRepoPath;
  };

  // Inline formatting parser for bold, italic, inline code, links, and citations
  const parseInline = (text: string): React.ReactNode => {
    // Regex splits on: Markdown Links [text](url), Citation Badges [^1] / [1], Bold **text**, Italic *text*, Inline Code `code`
    const pattern =
      /(\[[^\]]+\]\([^)]+\)|\[\^?\d+(?:,\s*\^?\d+)*\](?::)?|\*\*[^*]+\*\*|(?:\*|_)[^*_]+(?:\*|_)|`[^`]+`|~~[^~]+~~)/g;
    const parts = text.split(pattern);

    return parts.map((part, index) => {
      if (!part) return null;

      // 1. Markdown Links [title](url)
      const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const [, linkText, linkHref] = linkMatch;
        return (
          <a
            key={index}
            href={linkHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors font-medium"
          >
            {linkText}
          </a>
        );
      }

      // 2. Citation token matching [^1] or [1] or [^9]:
      const citationMatch = part.match(/^\[\^?(\d+)\](?::)?$/);
      if (citationMatch) {
        const citationNum = parseInt(citationMatch[1], 10);
        const citation = citations.find((c) => c.number === citationNum);
        if (citation) {
          return (
            <CitationBadge
              key={index}
              {...citation}
              onClick={() => {
                if (citation.path && onFileClick) {
                  onFileClick(citation.path);
                } else {
                  onCitationClick?.(citation);
                }
              }}
              className="mx-0.5 inline-flex align-middle"
            />
          );
        }
        // If raw footnote marker not in citations, omit it cleanly rather than showing ugly [^9]
        return null;
      }

      // 3. Bold **text**
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-bold text-white">
            {parseInline(part.slice(2, -2))}
          </strong>
        );
      }

      // 4. Italic *text* or _text_
      if (
        (part.startsWith('*') && part.endsWith('*') && part.length > 2) ||
        (part.startsWith('_') && part.endsWith('_') && part.length > 2)
      ) {
        return (
          <em key={index} className="italic text-slate-300">
            {part.slice(1, -1)}
          </em>
        );
      }

      // 5. Strikethrough ~~text~~
      if (part.startsWith('~~') && part.endsWith('~~')) {
        return (
          <del key={index} className="line-through text-slate-400">
            {part.slice(2, -2)}
          </del>
        );
      }

      // 6. Inline Code `code` or File Path
      if (part.startsWith('`') && part.endsWith('`')) {
        const codeText = part.slice(1, -1);
        if (isFilePath(codeText)) {
          return (
            <button
              key={index}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onFileClick?.(codeText);
              }}
              className="inline-flex items-center gap-1 font-mono text-[11px] rounded-md bg-blue-950/80 border border-blue-500/40 px-1.5 py-0.5 text-blue-300 hover:bg-blue-900/80 hover:text-white hover:border-blue-400 transition-all cursor-pointer shadow-xs align-middle"
              title={`View code for ${codeText}`}
            >
              <svg
                className="h-3 w-3 shrink-0 text-blue-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                <path d="M14 2v4a2 2 0 0 0 2 2h4" />
              </svg>
              <span>{codeText}</span>
            </button>
          );
        }
        return (
          <code
            key={index}
            className="rounded-md bg-slate-800/90 px-1.5 py-0.5 font-mono text-[11px] text-blue-300 border border-slate-700/70 font-semibold shadow-xs"
          >
            {codeText}
          </code>
        );
      }

      // 7. Check plain text for file paths like src/modules/...
      if (isFilePath(part.trim()) && !part.includes(' ')) {
        const cleanPath = part.trim();
        return (
          <button
            key={index}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFileClick?.(cleanPath);
            }}
            className="inline-flex items-center gap-1 font-mono text-[11px] rounded-md bg-blue-950/80 border border-blue-500/40 px-1.5 py-0.5 text-blue-300 hover:bg-blue-900/80 hover:text-white hover:border-blue-400 transition-all cursor-pointer shadow-xs align-middle"
            title={`View code for ${cleanPath}`}
          >
            <svg
              className="h-3 w-3 shrink-0 text-blue-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
              <path d="M14 2v4a2 2 0 0 0 2 2h4" />
            </svg>
            <span>{cleanPath}</span>
          </button>
        );
      }

      return part;
    });
  };

  return (
    <div
      className={cn(
        'space-y-3 text-xs sm:text-[13px] text-slate-200 leading-relaxed break-words',
        className,
      )}
    >
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'heading': {
            if (block.level === 1) {
              return (
                <h2
                  key={idx}
                  className="text-base sm:text-lg font-extrabold text-white tracking-tight pt-2 pb-1 border-b border-slate-800/80"
                >
                  {parseInline(block.text)}
                </h2>
              );
            }
            if (block.level === 2) {
              return (
                <h3 key={idx} className="text-sm sm:text-base font-bold text-white pt-2">
                  {parseInline(block.text)}
                </h3>
              );
            }
            if (block.level === 3) {
              return (
                <h4 key={idx} className="text-xs sm:text-sm font-semibold text-blue-300 pt-1">
                  {parseInline(block.text)}
                </h4>
              );
            }
            return (
              <h5 key={idx} className="text-xs font-semibold text-slate-300 pt-1">
                {parseInline(block.text)}
              </h5>
            );
          }

          case 'code':
            return (
              <CodeBlock
                key={idx}
                code={block.code}
                language={block.language}
                showLineNumbers={block.code.split('\n').length > 2}
                className="my-3 rounded-xl border border-slate-800 bg-[#060913] shadow-lg"
              />
            );

          case 'quote':
            return (
              <blockquote
                key={idx}
                className="border-l-2 border-blue-500/80 bg-blue-950/20 pl-3.5 py-1.5 rounded-r-lg text-xs italic text-slate-300 my-2"
              >
                {parseInline(block.text)}
              </blockquote>
            );

          case 'table':
            return (
              <div
                key={idx}
                className="my-3 overflow-x-auto rounded-xl border border-slate-800 bg-[#070b16] shadow-md"
              >
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-300 font-semibold">
                      {block.headers.map((head, hIdx) => (
                        <th key={hIdx} className="px-3.5 py-2">
                          {parseInline(head)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className="border-b border-slate-800/50 last:border-0 hover:bg-slate-900/30 transition-colors"
                      >
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className="px-3.5 py-2 text-slate-300 font-mono text-[11px]"
                          >
                            {parseInline(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          case 'list': {
            if (block.ordered) {
              return (
                <ol
                  key={idx}
                  className="space-y-1.5 my-2 pl-4 list-decimal marker:text-blue-400 marker:font-semibold"
                >
                  {block.items.map((item, iIdx) => (
                    <li key={iIdx} className="text-slate-200 leading-relaxed">
                      {parseInline(item)}
                    </li>
                  ))}
                </ol>
              );
            }
            return (
              <ul key={idx} className="space-y-1.5 my-2 pl-4 list-disc marker:text-blue-400">
                {block.items.map((item, iIdx) => (
                  <li key={iIdx} className="text-slate-200 leading-relaxed">
                    {parseInline(item)}
                  </li>
                ))}
              </ul>
            );
          }

          case 'hr':
            return <hr key={idx} className="border-slate-800 my-3" />;

          case 'paragraph':
          default:
            return (
              <div key={idx} className="leading-relaxed text-slate-200">
                {parseInline(block.text)}
              </div>
            );
        }
      })}

      {/* Verified Citations Footer Drawer at bottom of AI answer */}
      {citations.length > 0 && (
        <div className="mt-4 pt-3.5 border-t border-slate-800/80">
          <div className="text-[11px] font-bold text-slate-400 mb-2 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span>Verified Knowledge Citations ({citations.length})</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {citations.map((c, i) => (
              <CitationBadge
                key={i}
                {...c}
                onClick={() => {
                  if (c.path && onFileClick) {
                    onFileClick(c.path);
                  } else {
                    onCitationClick?.(c);
                  }
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
