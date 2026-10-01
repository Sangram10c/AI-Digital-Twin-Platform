'use client';

import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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

export function MarkdownRenderer({
  content,
  citations = [],
  onCitationClick,
  onFileClick,
  className,
}: MarkdownRendererProps) {
  // Robust unwrap of any raw JSON string (e.g. { "answer": "..." }) and escape sequences
  const sanitizedContent = React.useMemo(() => {
    if (!content) return '';
    let text = content.trim();

    // 1. If backend/history returned a raw JSON object string with "answer"
    if (text.startsWith('{') && text.includes('"answer"')) {
      try {
        const parsed = JSON.parse(text);
        if (typeof parsed.answer === 'string') {
          text = parsed.answer;
        }
      } catch {
        const match = text.match(/"answer"\s*:\s*"([\s\S]*?)"\s*,\s*"confidence"/);
        if (match?.[1]) {
          text = match[1];
        }
      }
    }

    // 2. Unescape escaped literal newlines (\n) if string contains no real newlines
    if (text.includes('\\n') && !text.includes('\n')) {
      text = text.replace(/\\n/g, '\n');
    }
    // Clean unicode escapes often emitted in LLM json (e.g. \u2011 -> ‑, \u2192 -> →)
    text = text
      .replace(/\\u2011/g, '‑')
      .replace(/\\u2192/g, '→')
      .replace(/\\"/g, '"');

    return text;
  }, [content]);

  // Check if string looks like a repo file path
  const isFilePath = (str: string) => {
    const trimmed = str.trim();
    if (trimmed.startsWith('@') || trimmed.includes(' ')) return false;
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

  // Helper to replace [^N] citations inside text nodes with CitationBadge components
  const renderTextWithCitations = (children: React.ReactNode): React.ReactNode => {
    if (typeof children === 'string') {
      const parts = children.split(/(\[\^?\d+\](?::)?)/g);
      if (parts.length === 1) return children;

      return parts.map((part, idx) => {
        const match = part.match(/^\[\^?(\d+)\](?::)?$/);
        if (match) {
          const num = parseInt(match[1], 10);
          const citation = citations.find((c) => c.number === num);
          if (citation) {
            return (
              <CitationBadge
                key={idx}
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
          return null;
        }
        return part;
      });
    }

    if (Array.isArray(children)) {
      return children.map((child, idx) => (
        <React.Fragment key={idx}>{renderTextWithCitations(child)}</React.Fragment>
      ));
    }

    return children;
  };

  return (
    <div
      className={cn(
        'chat-markdown w-full text-slate-200 text-sm sm:text-[14.5px] leading-relaxed break-words font-sans space-y-3.5',
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings with ChatGPT sizing and spacing
          h1: ({ children }) => (
            <h1 className="text-xl sm:text-2xl font-bold text-white mt-6 mb-3 pb-2 border-b border-slate-800/80 tracking-tight">
              {renderTextWithCitations(children)}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg sm:text-xl font-semibold text-white mt-5 mb-2.5 tracking-tight flex items-center gap-2">
              {renderTextWithCitations(children)}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-slate-100 mt-4 mb-2">
              {renderTextWithCitations(children)}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-semibold text-slate-200 mt-3 mb-1.5">
              {renderTextWithCitations(children)}
            </h4>
          ),

          // Paragraphs
          p: ({ children }) => (
            <p className="leading-relaxed text-slate-200 mb-3.5 last:mb-0">
              {renderTextWithCitations(children)}
            </p>
          ),

          // Lists
          ul: ({ children }) => (
            <ul className="space-y-1.5 my-3 pl-5 list-disc marker:text-blue-400 text-slate-200">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="space-y-1.5 my-3 pl-5 list-decimal marker:text-blue-400 text-slate-200">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed pl-1">{renderTextWithCitations(children)}</li>
          ),

          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500/80 bg-blue-950/20 rounded-r-lg px-4 py-2.5 my-3 text-slate-300 italic">
              {children}
            </blockquote>
          ),

          // Tables
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 shadow-md">
              <table className="w-full border-collapse text-xs sm:text-sm text-left">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-900/90 text-white font-semibold border-b border-slate-800">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="px-4 py-2.5 font-semibold text-slate-200">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2.5 border-b border-slate-800/50 text-slate-300">
              {renderTextWithCitations(children)}
            </td>
          ),

          // Horizontal rule
          hr: () => <hr className="my-6 border-slate-800" />,

          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors font-medium"
            >
              {children}
            </a>
          ),

          // Code blocks & Inline code
          code: ({ className: codeClassName, children, ...props }) => {
            const match = /language-(\w+)/.exec(codeClassName || '');
            const codeString = String(children).replace(/\n$/, '');

            // Block code with language or multi-line
            if (match || codeString.includes('\n')) {
              const lang = match ? match[1] : 'typescript';
              return (
                <CodeBlock
                  code={codeString}
                  language={lang}
                  showLineNumbers={codeString.split('\n').length > 2}
                />
              );
            }

            // Inline code: check if it's a file path
            if (isFilePath(codeString)) {
              return (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFileClick?.(codeString);
                  }}
                  className="inline-flex items-center gap-1 font-mono text-[11px] sm:text-xs rounded-md bg-blue-950/80 border border-blue-500/40 px-1.5 py-0.5 text-blue-300 hover:bg-blue-900/80 hover:text-white hover:border-blue-400 transition-all cursor-pointer shadow-xs align-middle"
                  title={`View file ${codeString}`}
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
                  <span>{codeString}</span>
                </button>
              );
            }

            // Standard inline code pill
            return (
              <code
                className="rounded-md bg-slate-800/80 px-1.5 py-0.5 font-mono text-[12px] text-blue-300 border border-slate-700/60 font-medium align-middle"
                {...props}
              >
                {codeString}
              </code>
            );
          },
        }}
      >
        {sanitizedContent}
      </ReactMarkdown>
    </div>
  );
}
