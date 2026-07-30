import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KnowledgeSourceType } from '@prisma/client';
import {
  IMPLEMENTATION_PATH_BOOSTS,
  NOISE_PATH_PENALTIES,
  RETRIEVAL_PATH_BOOSTS,
  SEARCH_DEFAULTS,
} from '../constants/search.constants';
import type {
  KeywordHit,
  RankedSearchHit,
  VectorHit,
} from '../interfaces/search.interfaces';
import type { ChunkHydrationRow } from '../repositories/search.repository';

@Injectable()
export class RankingService {
  constructor(private readonly config: ConfigService) {}

  mergeAndRank(input: {
    vectorHits: VectorHit[];
    keywordHits: KeywordHit[];
    chunks: ChunkHydrationRow[];
    previewChars: number;
    repositoryPriorityIds?: string[];
    /** Prefer .ts/.js source chunks for “which file / how implemented” questions. */
    preferSourceCode?: boolean;
    /** Original + expanded query terms for path/filename relevance. */
    queryTerms?: string[];
  }): RankedSearchHit[] {
    const weights = this.weights();
    const rrfK = this.config.get<number>('search.rrfK') ?? SEARCH_DEFAULTS.rrfK;
    const queryTerms = (input.queryTerms ?? [])
      .map((t) => t.toLowerCase())
      .filter((t) => t.length >= 2);

    const vectorById = new Map(input.vectorHits.map((h) => [h.chunkId, h]));
    const keywordById = new Map(input.keywordHits.map((h) => [h.chunkId, h]));
    const chunkById = new Map(input.chunks.map((c) => [c.chunk_id, c]));
    const priority = new Set(input.repositoryPriorityIds ?? []);

    const ids = new Set([
      ...input.vectorHits.map((h) => h.chunkId),
      ...input.keywordHits.map((h) => h.chunkId),
    ]);

    const maxKw = Math.max(
      ...input.keywordHits.map((h) => h.keywordScore),
      1e-9,
    );

    const now = Date.now();
    const ranked: RankedSearchHit[] = [];

    for (const id of ids) {
      const chunk = chunkById.get(id);
      if (!chunk) continue;

      const v = vectorById.get(id);
      const k = keywordById.get(id);
      const similarity = v?.similarity ?? 0;
      const keywordRaw = k?.keywordScore ?? 0;
      const keywordScore = keywordRaw / maxKw;
      const qualityScore = this.quality(chunk);
      const freshnessScore = this.freshness(chunk.created_at, now);
      const repositoryPriority =
        chunk.repository_id && priority.has(chunk.repository_id)
          ? 1
          : chunk.repository_id
            ? 0.5
            : 0.25;

      const rrfScore =
        (v ? 1 / (rrfK + v.rank) : 0) + (k ? 1 / (rrfK + k.rank) : 0);

      const metadata =
        chunk.metadata && typeof chunk.metadata === 'object'
          ? (chunk.metadata as Record<string, unknown>)
          : {};

      const isSourceCode =
        metadata.documentType === 'source_code' ||
        /\.(ts|tsx|js|jsx|mjs|cjs)$/i.test(chunk.file_path ?? '');

      const sourceCodeBoost =
        input.preferSourceCode && isSourceCode
          ? 0.22
          : input.preferSourceCode && !isSourceCode
            ? -0.08
            : 0;

      const pathBoost = this.pathRelevanceBoost(
        chunk.file_path,
        queryTerms,
        metadata,
        chunk.content,
      );

      const finalScore =
        weights.semantic * similarity +
        weights.keyword * keywordScore +
        weights.quality * qualityScore +
        weights.freshness * freshnessScore +
        weights.repository * repositoryPriority +
        0.15 * rrfScore +
        sourceCodeBoost +
        pathBoost;

      const previewSource =
        k?.headline?.replace(/<\/?b>/g, '') || chunk.content;
      const preview =
        previewSource.length > input.previewChars
          ? `${previewSource.slice(0, input.previewChars)}…`
          : previewSource;

      ranked.push({
        chunkId: id,
        repositoryId: chunk.repository_id,
        repositoryName: chunk.repository_name,
        repositoryFullName: chunk.repository_full_name,
        filePath: chunk.file_path,
        knowledgeType: chunk.knowledge_type,
        knowledgeSourceType:
          (chunk.knowledge_source_type as KnowledgeSourceType) || null,
        similarityScore: similarity,
        keywordScore,
        qualityScore,
        freshnessScore,
        repositoryPriority,
        rrfScore,
        finalScore,
        preview,
        metadata,
        citation: {
          knowledgeChunkId: id,
          knowledgeSourceId: chunk.knowledge_source_id,
          documentationId: chunk.documentation_id,
          path: chunk.file_path,
          title: chunk.title,
          externalRefId: chunk.external_ref_id,
        },
      });
    }

    ranked.sort((a, b) => {
      if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
      // Prefer canonical monorepo paths over short `src/...` duplicates.
      return (b.filePath?.length ?? 0) - (a.filePath?.length ?? 0);
    });
    return this.dedupeNearIdentical(ranked);
  }

  /**
   * Boost real implementation files; demote synonym dictionaries / wiring-only modules.
   */
  private pathRelevanceBoost(
    filePath: string | null,
    queryTerms: string[],
    metadata: Record<string, unknown>,
    content: string,
  ): number {
    if (!filePath) return 0;
    const path = filePath.replace(/\\/g, '/').toLowerCase();
    let boost = 0;
    const terms = new Set(queryTerms.map((t) => t.toLowerCase()));
    const storageIntent =
      terms.has('storage') ||
      terms.has('upsert') ||
      terms.has('persist') ||
      [...terms].some((t) => t.includes('storage'));

    for (const rule of IMPLEMENTATION_PATH_BOOSTS) {
      if (rule.re.test(path)) boost += rule.boost;
    }

    // vector-search / embedding-query help retrieval questions, not "storage".
    if (!storageIntent) {
      for (const rule of RETRIEVAL_PATH_BOOSTS) {
        if (rule.re.test(path)) boost += rule.boost;
      }
    } else if (/vector-search|embedding-query/i.test(path)) {
      boost -= 0.28;
    }

    if (storageIntent && /embedding-storage/i.test(path)) {
      boost += 0.25;
    }

    for (const rule of NOISE_PATH_PENALTIES) {
      if (rule.re.test(path)) boost -= rule.penalty;
    }

    // Filename / path segment overlap with query terms (skip ultra-generic).
    const generic = new Set(['src', 'modules', 'apps', 'backend', 'services']);
    const pathTokens = path.split(/[/._-]+/).filter((t) => t.length >= 3);
    for (const term of queryTerms) {
      const parts = term.split(/[-_/./]+/).filter((p) => p.length >= 3);
      for (const part of parts.length ? parts : [term]) {
        if (generic.has(part)) continue;
        if (path.includes(part) || pathTokens.includes(part)) {
          boost += 0.04;
        }
      }
    }

    const symbolName =
      typeof metadata.symbolName === 'string' ? metadata.symbolName : '';
    const symbolKind =
      typeof metadata.symbolKind === 'string' ? metadata.symbolKind : '';

    // Synonym map / expansion tables are keyword magnets — not implementations.
    if (
      /SEARCH_QUERY_EXPANSIONS|CODE_INTENT_TERMS/i.test(symbolName) ||
      /SEARCH_QUERY_EXPANSIONS/.test(content.slice(0, 400))
    ) {
      boost -= 0.5;
    }

    if (symbolKind === 'file_header') boost -= 0.18;
    if (symbolKind === 'class' || symbolKind === 'function') boost += 0.06;
    if (/StorageService|EmbeddingStorage/i.test(symbolName)) boost += 0.22;

    return Math.max(-0.7, Math.min(0.95, boost));
  }

  private weights() {
    const cfg = this.config.get<Record<string, number>>('search.weights');
    return {
      semantic: cfg?.semantic ?? SEARCH_DEFAULTS.weights.semantic,
      keyword: cfg?.keyword ?? SEARCH_DEFAULTS.weights.keyword,
      quality: cfg?.quality ?? SEARCH_DEFAULTS.weights.quality,
      freshness: cfg?.freshness ?? SEARCH_DEFAULTS.weights.freshness,
      repository: cfg?.repository ?? SEARCH_DEFAULTS.weights.repository,
    };
  }

  private quality(chunk: ChunkHydrationRow): number {
    const tokens = chunk.token_count ?? Math.ceil(chunk.content.length / 4);
    // Prefer mid-sized chunks (too tiny = weak evidence, too huge = noisy).
    if (tokens < 40) return 0.35;
    if (tokens > 1200) return 0.55;
    if (tokens >= 120 && tokens <= 600) return 1;
    return 0.75;
  }

  private freshness(createdAt: Date, now: number): number {
    const ageDays = Math.max(
      0,
      (now - new Date(createdAt).getTime()) / 86_400_000,
    );
    if (ageDays <= 7) return 1;
    if (ageDays <= 30) return 0.85;
    if (ageDays <= 90) return 0.65;
    if (ageDays <= 365) return 0.45;
    return 0.25;
  }

  /** Canonicalize monorepo vs cwd-relative duplicates of the same file. */
  canonicalFilePath(filePath: string | null | undefined): string {
    if (!filePath) return '';
    let n = filePath.replace(/\\/g, '/').toLowerCase();
    while (n.startsWith('apps/backend/')) {
      n = n.slice('apps/backend/'.length);
    }
    return n;
  }

  /** Drop near-duplicate previews / path variants keeping the higher-ranked hit. */
  private dedupeNearIdentical(hits: RankedSearchHit[]): RankedSearchHit[] {
    const seen = new Set<string>();
    const out: RankedSearchHit[] = [];
    for (const hit of hits) {
      const meta = hit.metadata ?? {};
      const symbol =
        typeof meta.symbolName === 'string'
          ? meta.symbolName
          : typeof meta.symbolKind === 'string'
            ? meta.symbolKind
            : '';
      const start =
        typeof meta.startLine === 'number' ? String(meta.startLine) : '';
      const canonical = this.canonicalFilePath(hit.filePath);
      const key = `${hit.repositoryId ?? ''}|${canonical}|${symbol}|${start}|${hit.preview.slice(0, 60)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(hit);
    }
    return out;
  }
}
