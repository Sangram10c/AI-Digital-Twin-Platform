import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';
import { buildSearchFilterSql } from '../filters/search-filter.builder';
import type {
  KeywordHit,
  SearchFilters,
  VectorHit,
} from '../interfaces/search.interfaces';

interface ChunkHydrationRow {
  chunk_id: string;
  repository_id: string | null;
  repository_name: string | null;
  repository_full_name: string | null;
  file_path: string | null;
  knowledge_type: string | null;
  knowledge_source_type: string | null;
  knowledge_source_id: string | null;
  documentation_id: string | null;
  title: string | null;
  external_ref_id: string | null;
  content: string;
  metadata: unknown;
  created_at: Date;
  token_count: number | null;
}

@Injectable()
export class SearchRepository {
  private readonly logger = new Logger(SearchRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async resolveRepositoryAliases(
    workspaceId: string,
    aliases: string[],
  ): Promise<string[]> {
    if (!aliases.length) return [];
    const rows = await this.prisma.repository.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        OR: aliases.flatMap((a) => [
          { name: { equals: a, mode: 'insensitive' } },
          { fullName: { contains: a, mode: 'insensitive' } },
        ]),
      },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }

  async vectorSearch(
    filters: SearchFilters,
    queryVector: number[],
    topK: number,
  ): Promise<VectorHit[]> {
    const vectorLiteral = `[${queryVector.join(',')}]`;
    const { clauses, params } = buildSearchFilterSql(filters, 2);
    const whereSql = clauses.join(' AND ');
    const limitIdx = params.length + 2;

    const sql = `
      SELECT
        kc.id AS chunk_id,
        (1 - (e.vector <=> $1::vector))::float8 AS similarity
      FROM embeddings e
      INNER JOIN knowledge_chunks kc ON kc.id = e.knowledge_chunk_id
      LEFT JOIN knowledge_sources ks ON ks.id = kc.knowledge_source_id
      LEFT JOIN documentation d ON d.id = kc.documentation_id
      LEFT JOIN repositories r ON r.id = kc.repository_id
      WHERE e.status = 'COMPLETED'
        AND e.vector IS NOT NULL
        AND ${whereSql}
      ORDER BY e.vector <=> $1::vector
      LIMIT $${limitIdx}
    `;

    const rows = await this.prisma.$queryRawUnsafe<
      Array<{ chunk_id: string; similarity: number }>
    >(sql, vectorLiteral, ...params, topK);

    return rows.map((row, index) => ({
      chunkId: row.chunk_id,
      similarity: Number(row.similarity) || 0,
      rank: index + 1,
    }));
  }

  async keywordSearch(
    filters: SearchFilters,
    tsQuery: string,
    topK: number,
  ): Promise<KeywordHit[]> {
    const { clauses, params } = buildSearchFilterSql(filters, 2);
    const whereSql = clauses.join(' AND ');
    const limitIdx = params.length + 2;

    const sql = `
      SELECT
        kc.id AS chunk_id,
        ts_rank_cd(kc.search_vector, to_tsquery('english', $1))::float8 AS keyword_score,
        ts_headline(
          'english',
          kc.content,
          to_tsquery('english', $1),
          'MaxWords=24, MinWords=12, ShortWord=2'
        ) AS headline
      FROM knowledge_chunks kc
      LEFT JOIN knowledge_sources ks ON ks.id = kc.knowledge_source_id
      LEFT JOIN documentation d ON d.id = kc.documentation_id
      LEFT JOIN repositories r ON r.id = kc.repository_id
      WHERE kc.search_vector @@ to_tsquery('english', $1)
        AND ${whereSql}
      ORDER BY keyword_score DESC
      LIMIT $${limitIdx}
    `;

    try {
      const rows = await this.prisma.$queryRawUnsafe<
        Array<{ chunk_id: string; keyword_score: number; headline: string }>
      >(sql, tsQuery, ...params, topK);

      return rows.map((row, index) => ({
        chunkId: row.chunk_id,
        keywordScore: Number(row.keyword_score) || 0,
        rank: index + 1,
        headline: row.headline,
      }));
    } catch (error) {
      this.logger.warn(
        `keywordSearch tsquery failed, falling back to websearch: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return this.keywordSearchWeb(filters, tsQuery, topK);
    }
  }

  /**
   * Path / filename match for source-code chunks (e.g. embedding-storage.service.ts).
   * Scores by how many query terms hit the path, with compound terms weighted higher.
   */
  async pathKeywordSearch(
    filters: SearchFilters,
    terms: string[],
    topK: number,
  ): Promise<KeywordHit[]> {
    const compounds = [
      ...new Set(
        terms
          .map((t) => t.trim().toLowerCase())
          .filter((t) => t.length >= 5 && /[-_/]/.test(t)),
      ),
    ].slice(0, 6);

    const cleaned = [
      ...new Set(
        terms
          .flatMap((t) => t.split(/[-_/./]+/))
          .map((t) => t.trim().toLowerCase())
          .filter((t) => t.length >= 3),
      ),
    ].slice(0, 12);

    if (!cleaned.length && !compounds.length) return [];

    const { clauses, params } = buildSearchFilterSql(filters, 1);
    const whereSql = clauses.join(' AND ');
    const likeParams: string[] = [];

    const pushLike = (term: string) => {
      likeParams.push(`%${term}%`);
      return params.length + likeParams.length;
    };

    const compoundScoreParts: string[] = [];
    for (const c of compounds) {
      const i = pushLike(c);
      compoundScoreParts.push(
        `(CASE WHEN coalesce(ks.path, '') ILIKE $${i} THEN 3.0 ELSE 0 END)`,
      );
    }

    const termScoreParts: string[] = [];
    const matchOrParts: string[] = [];
    for (const term of cleaned) {
      const i = pushLike(term);
      termScoreParts.push(
        `(CASE WHEN coalesce(ks.path, '') ILIKE $${i} THEN 1.0 WHEN kc.content ILIKE $${i} THEN 0.2 ELSE 0 END)`,
      );
      matchOrParts.push(
        `(coalesce(ks.path, kc.metadata->>'filePath', '') ILIKE $${i} OR kc.content ILIKE $${i})`,
      );
    }

    // Also match compound strings in OR filter
    for (let i = 0; i < compounds.length; i += 1) {
      const idx = params.length + i + 1; // compounds were pushed first
      matchOrParts.push(`coalesce(ks.path, '') ILIKE $${idx}`);
    }

    const scoreExpr = [
      ...compoundScoreParts,
      ...termScoreParts,
      `(CASE WHEN kc.metadata->>'symbolName' ILIKE '%Storage%' THEN 1.5 ELSE 0 END)`,
      `(CASE WHEN kc.metadata->>'symbolKind' = 'class' THEN 0.4 ELSE 0 END)`,
      `(CASE WHEN kc.metadata->>'symbolKind' = 'file_header' THEN -0.5 ELSE 0 END)`,
      `(CASE WHEN coalesce(ks.path, '') ~* '\\.(spec|test)\\.[jt]sx?$' THEN -2.0 ELSE 0 END)`,
    ].join(' + ');

    const limitIdx = params.length + likeParams.length + 1;
    const sql = `
      SELECT kc.id AS chunk_id,
        (${scoreExpr})::float8 AS keyword_score
      FROM knowledge_chunks kc
      LEFT JOIN knowledge_sources ks ON ks.id = kc.knowledge_source_id
      LEFT JOIN documentation d ON d.id = kc.documentation_id
      LEFT JOIN repositories r ON r.id = kc.repository_id
      WHERE ${whereSql}
        AND kc.metadata->>'documentType' = 'source_code'
        AND (${matchOrParts.join(' OR ') || 'TRUE'})
      ORDER BY keyword_score DESC
      LIMIT $${limitIdx}
    `;

    try {
      const rows = await this.prisma.$queryRawUnsafe<
        Array<{ chunk_id: string; keyword_score: number }>
      >(sql, ...params, ...likeParams, topK);
      return rows
        .filter((row) => Number(row.keyword_score) > 0)
        .map((row, index) => ({
          chunkId: row.chunk_id,
          keywordScore: Number(row.keyword_score) || 0,
          rank: index + 1,
        }));
    } catch (error) {
      this.logger.warn(
        `pathKeywordSearch failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return [];
    }
  }

  private async keywordSearchWeb(
    filters: SearchFilters,
    rawQuery: string,
    topK: number,
  ): Promise<KeywordHit[]> {
    const { clauses, params } = buildSearchFilterSql(filters, 2);
    const whereSql = clauses.join(' AND ');
    const limitIdx = params.length + 2;
    const sql = `
      SELECT
        kc.id AS chunk_id,
        ts_rank_cd(kc.search_vector, websearch_to_tsquery('english', $1))::float8 AS keyword_score
      FROM knowledge_chunks kc
      LEFT JOIN knowledge_sources ks ON ks.id = kc.knowledge_source_id
      LEFT JOIN documentation d ON d.id = kc.documentation_id
      LEFT JOIN repositories r ON r.id = kc.repository_id
      WHERE kc.search_vector @@ websearch_to_tsquery('english', $1)
        AND ${whereSql}
      ORDER BY keyword_score DESC
      LIMIT $${limitIdx}
    `;
    const rows = await this.prisma.$queryRawUnsafe<
      Array<{ chunk_id: string; keyword_score: number }>
    >(sql, rawQuery, ...params, topK);
    return rows.map((row, index) => ({
      chunkId: row.chunk_id,
      keywordScore: Number(row.keyword_score) || 0,
      rank: index + 1,
    }));
  }

  async hydrateChunks(chunkIds: string[]): Promise<ChunkHydrationRow[]> {
    if (!chunkIds.length) return [];
    const rows = await this.prisma.knowledgeChunk.findMany({
      where: { id: { in: chunkIds }, deletedAt: null },
      include: {
        repository: { select: { name: true, fullName: true } },
        knowledgeSource: {
          select: {
            id: true,
            path: true,
            title: true,
            sourceType: true,
            externalRefId: true,
          },
        },
        documentation: {
          select: { id: true, filePath: true, title: true, type: true },
        },
      },
    });

    return rows.map((kc) => ({
      chunk_id: kc.id,
      repository_id: kc.repositoryId,
      repository_name: kc.repository?.name ?? null,
      repository_full_name: kc.repository?.fullName ?? null,
      file_path: kc.knowledgeSource?.path ?? kc.documentation?.filePath ?? null,
      knowledge_type:
        kc.knowledgeSource?.sourceType?.toString() ??
        kc.documentation?.type?.toString() ??
        null,
      knowledge_source_type: kc.knowledgeSource?.sourceType?.toString() ?? null,
      knowledge_source_id: kc.knowledgeSourceId,
      documentation_id: kc.documentationId,
      title: kc.knowledgeSource?.title ?? kc.documentation?.title ?? null,
      external_ref_id: kc.knowledgeSource?.externalRefId ?? null,
      content: kc.content,
      metadata: kc.metadata,
      created_at: kc.createdAt,
      token_count: kc.tokenCount,
    }));
  }

  previewChars(): number {
    return this.config.get<number>('search.previewChars') ?? 280;
  }
}

export type { ChunkHydrationRow };
