// ============================================================
// Citation Builder Service
// Maps RankedSearchHits → Citation DB rows and CitationRef DTOs
// ============================================================

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import type { RankedSearchHit } from '../../search/interfaces/search.interfaces';
import type { CitationRef } from '../interfaces/chat.interfaces';

@Injectable()
export class CitationBuilderService {
  private readonly logger = new Logger(CitationBuilderService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ──────────────────────────────────────────────────────────
  // Build citation references for API response (no DB write)
  // ──────────────────────────────────────────────────────────

  buildRefs(hits: RankedSearchHit[]): CitationRef[] {
    return hits.map((hit, i) => ({
      index: i + 1,
      knowledgeChunkId: hit.citation.knowledgeChunkId,
      knowledgeSourceId: hit.citation.knowledgeSourceId,
      documentationId: hit.citation.documentationId,
      repositoryId: hit.repositoryId,
      repositoryName: hit.repositoryName,
      filePath: hit.citation.path,
      externalRefId: hit.citation.externalRefId,
      title: hit.citation.title,
      excerpt: this.buildExcerpt(hit.preview),
      relevanceScore: Math.round(hit.finalScore * 1000) / 1000,
    }));
  }

  // ──────────────────────────────────────────────────────────
  // Persist Citation rows to DB for a given message
  // ──────────────────────────────────────────────────────────

  async persistCitations(params: {
    messageId: string;
    hits: RankedSearchHit[];
    aiResponseId?: string;
  }): Promise<CitationRef[]> {
    const refs = this.buildRefs(params.hits);

    if (refs.length === 0) return [];

    try {
      await this.prisma.citation.createMany({
        data: refs.map((ref) => ({
          messageId: params.messageId,
          aiResponseId: params.aiResponseId ?? null,
          knowledgeChunkId: ref.knowledgeChunkId,
          knowledgeSourceId: ref.knowledgeSourceId,
          documentationId: ref.documentationId,
          citationIndex: ref.index,
          excerpt: ref.excerpt,
          relevanceScore: ref.relevanceScore,
        })),
        skipDuplicates: true,
      });

      this.logger.debug(
        `Persisted ${refs.length} citations for message ${params.messageId}`,
      );
    } catch (error) {
      // Citations are non-critical — log and continue.
      this.logger.error(
        `Failed to persist citations for message ${params.messageId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    return refs;
  }

  // ──────────────────────────────────────────────────────────
  // Unique source files/docs from citations
  // ──────────────────────────────────────────────────────────

  buildSources(hits: RankedSearchHit[]) {
    const seen = new Set<string>();
    const sources: Array<{
      repositoryId: string | null;
      repositoryName: string | null;
      filePath: string | null;
      title: string | null;
      relevanceScore: number;
      externalRefId: string | null;
    }> = [];

    for (const hit of hits) {
      const key = `${hit.repositoryId ?? ''}|${hit.citation.path ?? ''}|${hit.citation.title ?? ''}`;
      if (seen.has(key)) continue;
      seen.add(key);

      sources.push({
        repositoryId: hit.repositoryId,
        repositoryName: hit.repositoryName,
        filePath: hit.citation.path,
        title: hit.citation.title,
        relevanceScore: Math.round(hit.finalScore * 1000) / 1000,
        externalRefId: hit.citation.externalRefId,
      });
    }

    // Sort by relevance descending.
    return sources.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  // ──────────────────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────────────────

  private buildExcerpt(preview: string): string {
    const cleaned = preview.replace(/\s+/g, ' ').trim();
    return cleaned.length <= 300 ? cleaned : cleaned.slice(0, 297) + '…';
  }
}
