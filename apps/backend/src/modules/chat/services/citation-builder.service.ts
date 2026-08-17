// ============================================================
// Citation Builder Service
// Maps RankedSearchHits → Citation DB rows and CitationRef DTOs.
//
// IMPORTANT: The Prisma Citation model stores:
//   knowledgeChunkId, knowledgeSourceId, messageId, aiResponseId,
//   excerpt, startOffset, endOffset, relevanceScore, metadata.
//
// citationIndex and documentationId are NOT Prisma model fields.
// They are stored inside the metadata JSON for auditability.
// ============================================================

import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import type { RankedSearchHit } from '../../search/interfaces/search.interfaces';
import type { CitationRef, ChatSource } from '../interfaces/chat.interfaces';

// ────────────────────────────────────────────────────────────
// Result type for citation persistence
// ────────────────────────────────────────────────────────────

export interface CitationPersistenceResult {
  /** Citation refs returned to the client. */
  citations: CitationRef[];
  /** True when all citations were persisted successfully. */
  allPersisted: boolean;
  /** Number of citations that failed to persist. */
  failureCount: number;
}

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
  // Persist Citation rows to DB for a given message.
  //
  // Strategy:
  //  1. Build refs from search hits.
  //  2. Attempt bulk createMany (skipDuplicates=true).
  //  3. On failure, attempt individual inserts so partial
  //     results survive.
  //  4. Always return refs — citation persistence failure must
  //     NOT prevent the answer from reaching the client, but
  //     it MUST be logged with full context for debugging.
  // ──────────────────────────────────────────────────────────

  async persistCitations(params: {
    messageId: string;
    hits: RankedSearchHit[];
    aiResponseId?: string;
  }): Promise<CitationPersistenceResult> {
    const refs = this.buildRefs(params.hits);

    if (refs.length === 0) {
      return { citations: [], allPersisted: true, failureCount: 0 };
    }

    // Build valid Prisma CitationCreateManyInput objects.
    // citationIndex and documentationId are stored in metadata JSON
    // because they are NOT columns on the citations table.
    const rows = refs.map((ref) => ({
      messageId: params.messageId,
      aiResponseId: params.aiResponseId ?? null,
      knowledgeChunkId: ref.knowledgeChunkId,
      knowledgeSourceId: ref.knowledgeSourceId,
      excerpt: ref.excerpt,
      relevanceScore: ref.relevanceScore,
      // Pack extra fields into metadata so they can be recovered later
      metadata: {
        index: ref.index,
        documentationId: ref.documentationId,
        repositoryId: ref.repositoryId,
        repositoryName: ref.repositoryName,
        filePath: ref.filePath,
        externalRefId: ref.externalRefId,
        title: ref.title,
      },
    }));

    // ── Attempt bulk insert ───────────────────────────────────
    try {
      await this.prisma.citation.createMany({
        data: rows,
        skipDuplicates: true,
      });

      this.logger.debug(
        `[CitationBuilder] Persisted ${refs.length} citations for message=${params.messageId}`,
      );

      return { citations: refs, allPersisted: true, failureCount: 0 };
    } catch (bulkError) {
      // Bulk insert failed — attempt individual inserts for partial recovery.
      this.logger.warn(
        `[CitationBuilder] Bulk citation insert failed for message=${params.messageId}. ` +
          `Attempting individual inserts. Error: ${bulkError instanceof Error ? bulkError.message : String(bulkError)}`,
      );

      return this.persistIndividually({
        rows,
        refs,
        messageId: params.messageId,
        aiResponseId: params.aiResponseId,
      });
    }
  }

  // ──────────────────────────────────────────────────────────
  // Fallback: one-by-one insertion for partial recovery
  // ──────────────────────────────────────────────────────────

  private async persistIndividually(params: {
    rows: Array<Record<string, unknown>>;
    refs: CitationRef[];
    messageId: string;
    aiResponseId?: string;
  }): Promise<CitationPersistenceResult> {
    let failureCount = 0;

    for (let i = 0; i < params.rows.length; i++) {
      const row = params.rows[i];
      const ref = params.refs[i];

      try {
        await this.prisma.citation.create({ data: row as never });
      } catch (singleError) {
        failureCount += 1;
        this.logger.error(
          `[CitationBuilder] Failed to persist citation index=${ref?.index ?? i + 1} ` +
            `knowledgeChunkId=${String(row['knowledgeChunkId'])} ` +
            `messageId=${params.messageId} ` +
            `aiResponseId=${params.aiResponseId ?? 'none'}: ` +
            `${singleError instanceof Error ? singleError.message : String(singleError)}`,
        );
      }
    }

    const successCount = params.rows.length - failureCount;
    this.logger.warn(
      `[CitationBuilder] Individual inserts complete for message=${params.messageId}: ` +
        `${successCount}/${params.rows.length} succeeded, ${failureCount} failed.`,
    );

    if (failureCount === params.rows.length) {
      // Total failure — throw so caller can handle accordingly.
      throw new InternalServerErrorException(
        `All ${params.rows.length} citation inserts failed for message=${params.messageId}. ` +
          `The AI answer has been returned but no source citations could be persisted.`,
      );
    }

    return {
      citations: params.refs,
      allPersisted: failureCount === 0,
      failureCount,
    };
  }

  // ──────────────────────────────────────────────────────────
  // Unique source files/docs from search hits
  // ──────────────────────────────────────────────────────────

  buildSources(hits: RankedSearchHit[]): ChatSource[] {
    const seen = new Set<string>();
    const sources: ChatSource[] = [];

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
