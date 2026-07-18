import { Injectable } from '@nestjs/common';
import { DEFAULT_KNOWLEDGE_LIMITS } from '../constants/knowledge.constants';
import { KnowledgeChunkDraft } from '../interfaces/knowledge.interfaces';
import { estimateTokenCount, contentChecksum } from '../utils/checksum.util';
import { MarkdownParserService } from '../parsers/markdown-parser.service';

@Injectable()
export class KnowledgeChunkerService {
  constructor(private readonly markdownParser: MarkdownParserService) {}

  chunkDocument(
    cleanedContent: string,
    maxChunkSize: number = DEFAULT_KNOWLEDGE_LIMITS.maxChunkSize,
  ): KnowledgeChunkDraft[] {
    const sections = this.markdownParser.splitByHeadings(cleanedContent);
    const drafts: KnowledgeChunkDraft[] = [];
    let chunkIndex = 0;

    for (const section of sections) {
      const sectionHeader = section.heading
        ? `${'#'.repeat(section.level ?? 1)} ${section.heading}\n\n`
        : '';
      const sectionBody = section.content.trim();
      const sectionText = `${sectionHeader}${sectionBody}`.trim();

      if (!sectionText) continue;

      if (sectionText.length <= maxChunkSize) {
        drafts.push(
          this.createDraft(sectionText, chunkIndex++, {
            heading: section.heading,
            sectionLevel: section.level,
          }),
        );
        continue;
      }

      const paragraphs = this.markdownParser.splitByParagraphs(sectionText);
      let buffer = '';

      for (const paragraph of paragraphs) {
        if (paragraph.length > maxChunkSize) {
          if (buffer.trim()) {
            drafts.push(this.createDraft(buffer.trim(), chunkIndex++));
            buffer = '';
          }
          drafts.push(
            ...this.splitOversized(paragraph, maxChunkSize, chunkIndex),
          );
          chunkIndex = drafts.length;
          continue;
        }

        const candidate = buffer ? `${buffer}\n\n${paragraph}` : paragraph;
        if (candidate.length > maxChunkSize) {
          drafts.push(this.createDraft(buffer.trim(), chunkIndex++));
          buffer = paragraph;
        } else {
          buffer = candidate;
        }
      }

      if (buffer.trim()) {
        drafts.push(this.createDraft(buffer.trim(), chunkIndex++));
      }
    }

    if (drafts.length === 0 && cleanedContent.trim()) {
      drafts.push(this.createDraft(cleanedContent.trim(), 0));
    }

    return drafts;
  }

  private splitOversized(
    text: string,
    maxChunkSize: number,
    startIndex: number,
  ): KnowledgeChunkDraft[] {
    const drafts: KnowledgeChunkDraft[] = [];
    let index = startIndex;

    for (let offset = 0; offset < text.length; offset += maxChunkSize) {
      const slice = text.slice(offset, offset + maxChunkSize).trim();
      if (slice) {
        drafts.push(this.createDraft(slice, index++));
      }
    }

    return drafts;
  }

  private createDraft(
    content: string,
    chunkIndex: number,
    metadata: Record<string, unknown> = {},
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
