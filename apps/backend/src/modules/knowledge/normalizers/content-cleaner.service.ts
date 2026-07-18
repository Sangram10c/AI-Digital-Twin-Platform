import { Injectable } from '@nestjs/common';

/**
 * Normalizes raw text while preserving semantic structure (code blocks, links).
 */
@Injectable()
export class ContentCleanerService {
  clean(content: string): string {
    if (!content) return '';

    let normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    normalized = this.normalizeUnicode(normalized);
    normalized = this.stripHtmlComments(normalized);
    normalized = this.normalizeHtmlBlocks(normalized);
    normalized = this.normalizeWhitespace(normalized);
    normalized = this.normalizeSpecialCharacters(normalized);

    return normalized.trim();
  }

  private normalizeUnicode(content: string): string {
    return content.normalize('NFKC');
  }

  private stripHtmlComments(content: string): string {
    return content.replace(/<!--[\s\S]*?-->/g, '');
  }

  private normalizeHtmlBlocks(content: string): string {
    return content
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/h[1-6]>/gi, '\n\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<[^>]+>/g, '');
  }

  private normalizeWhitespace(content: string): string {
    const segments = this.splitPreservingCodeBlocks(content);
    return segments
      .map((segment) => {
        if (segment.type === 'code') return segment.value;
        return segment.value
          .replace(/[\t\f\v]+/g, ' ')
          .replace(/[^\S\n]+/g, ' ')
          .replace(/\n{3,}/g, '\n\n');
      })
      .join('');
  }

  private normalizeSpecialCharacters(content: string): string {
    return content
      .replace(/\u00a0/g, ' ')
      .replace(/[\u200b-\u200d\ufeff]/g, '');
  }

  splitPreservingCodeBlocks(content: string): Array<{
    type: 'code' | 'text';
    value: string;
  }> {
    const segments: Array<{ type: 'code' | 'text'; value: string }> = [];
    const pattern = /```[\s\S]*?```/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(content)) !== null) {
      if (match.index > lastIndex) {
        segments.push({
          type: 'text',
          value: content.slice(lastIndex, match.index),
        });
      }
      segments.push({ type: 'code', value: match[0] });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      segments.push({ type: 'text', value: content.slice(lastIndex) });
    }

    return segments.length > 0 ? segments : [{ type: 'text', value: content }];
  }
}
