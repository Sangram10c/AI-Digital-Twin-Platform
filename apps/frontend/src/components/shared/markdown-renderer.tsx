'use client';

import * as React from 'react';
import { cn } from '@/utils/cn';
import { CodeBlock } from './code-block';
import { CitationBadge, type CitationProps } from './citation-badge';

export interface MarkdownRendererProps {
  content: string;
  citations?: CitationProps[];
  onCitationClick?: (citation: CitationProps) => void;
  className?: string;
}

export function MarkdownRenderer({
  content,
  citations = [],
  onCitationClick,
  className,
}: MarkdownRendererProps) {
  // Simple, robust developer markdown parser for headings, lists, code blocks, bold, and citations
  const renderFormattedText = () => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeLanguage = '';
    let codeContent: string[] = [];

    lines.forEach((line, index) => {
      // Code block detection
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <CodeBlock
              key={`code-${index}`}
              code={codeContent.join('\n')}
              language={codeLanguage || 'typescript'}
            />,
          );
          inCodeBlock = false;
          codeContent = [];
          codeLanguage = '';
        } else {
          inCodeBlock = true;
          codeLanguage = line.slice(3).trim();
        }
        return;
      }

      if (inCodeBlock) {
        codeContent.push(line);
        return;
      }

      // Headings
      if (line.startsWith('### ')) {
        elements.push(
          <h4 key={index} className="text-sm font-bold text-foreground mt-3 mb-1">
            {line.slice(4)}
          </h4>,
        );
        return;
      }
      if (line.startsWith('## ')) {
        elements.push(
          <h3 key={index} className="text-base font-bold text-foreground mt-4 mb-1.5">
            {line.slice(3)}
          </h3>,
        );
        return;
      }
      if (line.startsWith('# ')) {
        elements.push(
          <h2 key={index} className="text-lg font-bold text-foreground mt-5 mb-2">
            {line.slice(2)}
          </h2>,
        );
        return;
      }

      // Bullet lists
      if (line.startsWith('- ') || line.startsWith('* ')) {
        elements.push(
          <li
            key={index}
            className="ml-4 list-disc text-xs leading-relaxed text-foreground/90 my-0.5"
          >
            {parseInline(line.slice(2))}
          </li>,
        );
        return;
      }

      // Empty lines
      if (!line.trim()) {
        elements.push(<div key={index} className="h-2" />);
        return;
      }

      // Standard paragraphs
      elements.push(
        <p key={index} className="text-xs leading-relaxed text-foreground/90 my-1">
          {parseInline(line)}
        </p>,
      );
    });

    return elements;
  };

  const parseInline = (text: string): React.ReactNode => {
    // Bold parsing (**text**)
    const parts = text.split(/(\*\*.*?\*\*|`.*?`|\[\d+\])/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-foreground">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={i}
            className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground border border-border"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      // Citation token matching [1], [2], etc.
      const match = part.match(/^\[(\d+)\]$/);
      if (match) {
        const citationNum = parseInt(match[1], 10);
        const citation = citations.find((c) => c.number === citationNum);
        if (citation) {
          return (
            <CitationBadge
              key={i}
              {...citation}
              onClick={() => onCitationClick?.(citation)}
              className="mx-0.5 inline-flex"
            />
          );
        }
      }
      return part;
    });
  };

  return (
    <div className={cn('space-y-1 text-xs text-foreground', className)}>
      {renderFormattedText()}

      {/* Citations Footer Section if citations provided */}
      {citations.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border">
          <div className="text-[11px] font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-ai" />
            Verified Citations ({citations.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {citations.map((c, i) => (
              <CitationBadge key={i} {...c} onClick={() => onCitationClick?.(c)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
