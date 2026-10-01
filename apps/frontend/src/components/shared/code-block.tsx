'use client';

import * as React from 'react';
import { cn } from '@/utils/cn';

export interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
  className?: string;
}

export function CodeBlock({
  code,
  language = 'typescript',
  filename,
  showLineNumbers = true,
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const lines = code.trim().split('\n');

  return (
    <div
      className={cn(
        'relative my-4 overflow-hidden rounded-xl border border-slate-700/60 bg-[#0d1117] font-mono text-xs sm:text-[13px] shadow-lg',
        className,
      )}
    >
      {/* Header bar — exact ChatGPT style */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 py-2 text-xs text-slate-400 font-sans">
        <div className="flex items-center gap-2">
          {filename && <span className="font-medium text-slate-200">{filename}</span>}
          <span className="font-mono text-[11px] text-slate-400 lowercase">{language}</span>
        </div>
        <button
          onClick={handleCopy}
          type="button"
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100 cursor-pointer"
        >
          {copied ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-emerald-400"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-slate-400"
              >
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
              </svg>
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>

      {/* Code contents */}
      <div className="overflow-x-auto p-4 text-slate-200">
        <pre className="flex font-mono leading-relaxed text-[12.5px] sm:text-[13px]">
          {showLineNumbers && lines.length > 2 && (
            <div className="mr-4 select-none text-right text-slate-600 font-mono space-y-0.5">
              {lines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
          )}
          <code className="space-y-0.5 flex-1">
            {lines.map((line, i) => (
              <div key={i} className="leading-relaxed">
                {line || ' '}
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
