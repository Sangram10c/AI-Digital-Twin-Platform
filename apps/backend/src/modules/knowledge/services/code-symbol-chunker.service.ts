import { Injectable } from '@nestjs/common';
import { DEFAULT_KNOWLEDGE_LIMITS } from '../constants/knowledge.constants';
import { KnowledgeChunkDraft } from '../interfaces/knowledge.interfaces';
import { contentChecksum, estimateTokenCount } from '../utils/checksum.util';

interface SymbolBlock {
  name: string;
  kind: string;
  startLine: number;
  endLine: number;
  text: string;
}

/**
 * Structure-aware chunking for source files (classes / functions / exports).
 * Does not call any AI models.
 */
@Injectable()
export class CodeSymbolChunkerService {
  chunkCode(
    content: string,
    filePath: string,
    maxChunkSize: number = DEFAULT_KNOWLEDGE_LIMITS.maxChunkSize,
  ): KnowledgeChunkDraft[] {
    const lines = content.replace(/\r\n/g, '\n').split('\n');
    const blocks = this.extractBlocks(lines);
    const drafts: KnowledgeChunkDraft[] = [];
    let chunkIndex = 0;

    const header = this.fileHeader(filePath, lines);
    if (header.trim()) {
      drafts.push(
        this.draft(header.trim(), chunkIndex++, {
          filePath,
          symbolName: null,
          symbolKind: 'file_header',
          startLine: 1,
          endLine: Math.min(40, lines.length),
          documentType: 'source_code',
        }),
      );
    }

    if (blocks.length === 0) {
      return this.fallbackSlices(content, filePath, chunkIndex, maxChunkSize);
    }

    for (const block of blocks) {
      const prefixed = `// File: ${filePath}\n// ${block.kind}: ${block.name}\n\n${block.text}`;
      if (prefixed.length <= maxChunkSize) {
        drafts.push(
          this.draft(prefixed, chunkIndex++, {
            filePath,
            symbolName: block.name,
            symbolKind: block.kind,
            startLine: block.startLine,
            endLine: block.endLine,
            documentType: 'source_code',
          }),
        );
        continue;
      }

      for (const slice of this.sliceText(prefixed, maxChunkSize)) {
        drafts.push(
          this.draft(slice, chunkIndex++, {
            filePath,
            symbolName: block.name,
            symbolKind: block.kind,
            startLine: block.startLine,
            endLine: block.endLine,
            documentType: 'source_code',
            partial: true,
          }),
        );
      }
    }

    return drafts;
  }

  private fileHeader(filePath: string, lines: string[]): string {
    const importLines: string[] = [];
    const preview: string[] = [];
    for (let i = 0; i < lines.length && i < 80; i += 1) {
      const line = lines[i] ?? '';
      if (
        /^\s*(import|export\s+\*|from\s+)/.test(line) ||
        /^\s*using\s+/.test(line)
      ) {
        importLines.push(line);
      }
      if (i < 25) preview.push(line);
    }
    const topicTags = this.topicTagsForPath(filePath);
    const parts = [
      `// File: ${filePath}`,
      '// Summary: source file header (imports + prelude)',
      ...(topicTags ? [`// Topics: ${topicTags}`] : []),
      '',
      ...importLines.slice(0, 40),
      '',
      ...preview,
    ];
    return parts.join('\n');
  }

  /** Extra searchable terms so FTS finds code that uses ::vector but not the word pgvector. */
  private topicTagsForPath(filePath: string): string | null {
    const p = filePath.replace(/\\/g, '/').toLowerCase();
    if (p.includes('/embeddings/') || p.includes('embedding-')) {
      return 'pgvector embedding vector storage upsert cosine similarity';
    }
    if (
      p.includes('/search/') &&
      (p.includes('vector') || p.includes('hybrid') || p.includes('ranking'))
    ) {
      return 'pgvector hybrid search vector keyword ranking';
    }
    return null;
  }

  private extractBlocks(lines: string[]): SymbolBlock[] {
    const blocks: SymbolBlock[] = [];
    const startRe =
      /^(\s*)(?:export\s+)?(?:async\s+)?(?:default\s+)?(class|function|interface|type|enum|const|let|var)\s+([A-Za-z0-9_]+)/;

    let i = 0;
    while (i < lines.length) {
      const line = lines[i] ?? '';
      const match = startRe.exec(line);
      if (!match) {
        i += 1;
        continue;
      }

      const kind = match[2];
      const name = match[3];
      const startLine = i + 1;

      // arrow / const fn: capture until blank line + brace balance if braces present
      const end =
        kind === 'const' || kind === 'let' || kind === 'var'
          ? this.scanStatement(lines, i)
          : this.scanBalanced(lines, i);

      const text = lines
        .slice(i, end + 1)
        .join('\n')
        .trim();
      if (text.length >= 40) {
        blocks.push({
          name,
          kind,
          startLine,
          endLine: end + 1,
          text,
        });
      }
      i = Math.max(end + 1, i + 1);
    }

    return blocks;
  }

  private scanBalanced(lines: string[], start: number): number {
    let depth = 0;
    let seen = false;
    for (let i = start; i < lines.length; i += 1) {
      const line = lines[i] ?? '';
      for (const ch of line) {
        if (ch === '{') {
          depth += 1;
          seen = true;
        } else if (ch === '}') {
          depth -= 1;
        }
      }
      if (seen && depth <= 0) return i;
      // type aliases without braces
      if (!seen && /;\s*$/.test(line) && i > start) return i;
    }
    return Math.min(start + 120, lines.length - 1);
  }

  private scanStatement(lines: string[], start: number): number {
    const first = lines[start] ?? '';
    if (!first.includes('=>') && !first.includes('{') && !first.includes('(')) {
      // simple const — take a few lines
      return Math.min(start + 15, lines.length - 1);
    }
    return this.scanBalanced(lines, start);
  }

  private fallbackSlices(
    content: string,
    filePath: string,
    startIndex: number,
    maxChunkSize: number,
  ): KnowledgeChunkDraft[] {
    const drafts: KnowledgeChunkDraft[] = [];
    let index = startIndex;
    for (const slice of this.sliceText(
      `// File: ${filePath}\n\n${content}`,
      maxChunkSize,
    )) {
      drafts.push(
        this.draft(slice, index++, {
          filePath,
          symbolName: null,
          symbolKind: 'file_slice',
          documentType: 'source_code',
        }),
      );
    }
    return drafts;
  }

  private sliceText(text: string, maxChunkSize: number): string[] {
    const out: string[] = [];
    for (let offset = 0; offset < text.length; offset += maxChunkSize) {
      const slice = text.slice(offset, offset + maxChunkSize).trim();
      if (slice) out.push(slice);
    }
    return out;
  }

  private draft(
    content: string,
    chunkIndex: number,
    metadata: Record<string, unknown>,
  ): KnowledgeChunkDraft {
    return {
      content,
      chunkIndex,
      tokenCount: estimateTokenCount(
        content,
        DEFAULT_KNOWLEDGE_LIMITS.tokenEstimateRatio,
      ),
      contentHash: contentChecksum(content),
      metadata,
    };
  }
}
