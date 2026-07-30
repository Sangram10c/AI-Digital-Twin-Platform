import {
  BadRequestException,
  Injectable,
  RequestTimeoutException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SearchType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  CODE_INTENT_TERMS,
  SEARCH_DEFAULTS,
  SEARCH_TOP_K_OPTIONS,
  type SearchMode,
  type SearchTopK,
} from './constants/search.constants';
import type { SearchRequestDto } from './dto/search.dto';
import type {
  SearchExecuteInput,
  SearchFilters,
  SearchResponse,
} from './interfaces/search.interfaces';
import { QueryProcessor } from './query/query-processor.service';
import { SearchRepository } from './repositories/search.repository';
import { KeywordSearchService } from './services/keyword-search.service';
import { RankingService } from './services/ranking.service';
import { SearchCacheService } from './services/search-cache.service';
import { SearchLogger } from './services/search-logger.service';
import { SearchMetricsService } from './services/search-metrics.service';
import { VectorSearchService } from './services/vector-search.service';

@Injectable()
export class SearchService {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly queryProcessor: QueryProcessor,
    private readonly vectorSearch: VectorSearchService,
    private readonly keywordSearch: KeywordSearchService,
    private readonly ranking: RankingService,
    private readonly cache: SearchCacheService,
    private readonly metrics: SearchMetricsService,
    private readonly searchLogger: SearchLogger,
    private readonly repo: SearchRepository,
  ) {}

  hybrid(userId: string, dto: SearchRequestDto): Promise<SearchResponse> {
    return this.execute(this.toInput(userId, 'hybrid', dto));
  }

  vector(userId: string, dto: SearchRequestDto): Promise<SearchResponse> {
    return this.execute(this.toInput(userId, 'vector', dto));
  }

  keyword(userId: string, dto: SearchRequestDto): Promise<SearchResponse> {
    return this.execute(this.toInput(userId, 'keyword', dto));
  }

  /** Alias for hybrid — primary retrieval entrypoint. */
  search(userId: string, dto: SearchRequestDto): Promise<SearchResponse> {
    return this.hybrid(userId, dto);
  }

  async history(workspaceId: string, userId: string, limit = 20) {
    const take = Math.min(
      Math.max(limit, 1),
      this.config.get<number>('search.historyLimit') ??
        SEARCH_DEFAULTS.historyLimit,
    );
    return this.prisma.searchHistory.findMany({
      where: { workspaceId, userId },
      orderBy: { createdAt: 'desc' },
      take,
      select: {
        id: true,
        query: true,
        searchType: true,
        resultsCount: true,
        latencyMs: true,
        repositoryId: true,
        searchFilters: true,
        createdAt: true,
      },
    });
  }

  statistics(workspaceId: string) {
    return this.metrics.getStatistics(workspaceId);
  }

  popular(workspaceId: string, limit = 20) {
    return this.cache.getPopular(workspaceId, limit);
  }

  private toInput(
    userId: string,
    mode: SearchMode,
    dto: SearchRequestDto,
  ): SearchExecuteInput {
    const topK = this.resolveTopK(dto.topK);
    return {
      userId,
      mode,
      query: dto.query,
      topK,
      page: dto.page ?? 1,
      pageSize: dto.pageSize ?? topK,
      skipCache: dto.skipCache,
      filters: {
        workspaceId: dto.workspaceId,
        repositoryIds: dto.repositoryIds,
        branch: dto.branch,
        language: dto.language,
        framework: dto.framework,
        module: dto.module,
        directory: dto.directory,
        fileExtension: dto.fileExtension,
        documentType: dto.documentType,
        knowledgeSourceType: dto.knowledgeSourceType,
        commitSha: dto.commitSha,
        pullRequestId: dto.pullRequestId,
        issueId: dto.issueId,
        tag: dto.tag,
        dateFrom: dto.dateFrom ? new Date(dto.dateFrom) : undefined,
        dateTo: dto.dateTo ? new Date(dto.dateTo) : undefined,
      },
    };
  }

  private resolveTopK(value?: number): SearchTopK {
    const max =
      this.config.get<number>('search.maxTopK') ?? SEARCH_DEFAULTS.maxTopK;
    const fallback =
      this.config.get<number>('search.defaultTopK') ?? SEARCH_DEFAULTS.topK;
    const candidate = value ?? fallback;
    if (!(SEARCH_TOP_K_OPTIONS as readonly number[]).includes(candidate)) {
      throw new BadRequestException(
        `topK must be one of ${SEARCH_TOP_K_OPTIONS.join(', ')}`,
      );
    }
    if (candidate > max) {
      throw new BadRequestException(`topK cannot exceed ${max}`);
    }
    return candidate as SearchTopK;
  }

  private async execute(input: SearchExecuteInput): Promise<SearchResponse> {
    const started = Date.now();
    const timeoutMs =
      this.config.get<number>('search.timeoutMs') ?? SEARCH_DEFAULTS.timeoutMs;

    try {
      return await this.withTimeout(
        this.executeInner(input, started),
        timeoutMs,
      );
    } catch (error) {
      this.searchLogger.logError(input.mode, error);
      throw error;
    }
  }

  private async executeInner(
    input: SearchExecuteInput,
    started: number,
  ): Promise<SearchResponse> {
    const queryStart = Date.now();
    const processed = this.queryProcessor.process(input.query);
    const queryMs = Date.now() - queryStart;

    const aliasIds = await this.repo.resolveRepositoryAliases(
      input.filters.workspaceId,
      processed.repositoryAliases,
    );
    const filters: SearchFilters = {
      ...input.filters,
      repositoryIds: [
        ...new Set([...(input.filters.repositoryIds ?? []), ...aliasIds]),
      ],
    };
    if (!filters.repositoryIds?.length) {
      delete filters.repositoryIds;
    }

    const searchType = this.toSearchType(input.mode);
    const cacheHash = this.cache.hashKey({
      mode: input.mode,
      query: processed.normalized,
      filters,
      topK: input.topK,
      page: input.page,
      pageSize: input.pageSize,
    });

    if (!input.skipCache) {
      const cached = await this.cache.getResult(cacheHash);
      if (cached) {
        const timing = {
          ...cached.timing,
          totalMs: Date.now() - started,
          cacheHit: true,
        };
        const response = { ...cached, timing };
        await this.persistSideEffects(input, processed.raw, response, filters);
        return response;
      }
    }

    const fetchK = Math.min(
      50,
      Math.max(input.topK, input.page * input.pageSize),
    );

    let embeddingMs = 0;
    let vectorMs = 0;
    let keywordMs = 0;
    let vectorHits = [] as Awaited<
      ReturnType<VectorSearchService['search']>
    >['hits'];
    let keywordHits = [] as Awaited<
      ReturnType<KeywordSearchService['search']>
    >['hits'];

    if (input.mode === 'hybrid') {
      const [vectorPart, keywordPart] = await Promise.all([
        this.vectorSearch.search(filters, processed.embeddingText, fetchK),
        this.keywordSearch.search(
          filters,
          processed.tsQuery,
          processed.normalized,
          fetchK,
          processed.expandedTerms,
        ),
      ]);
      vectorHits = vectorPart.hits;
      embeddingMs = vectorPart.embeddingMs;
      vectorMs = vectorPart.vectorMs;
      keywordHits = keywordPart.hits;
      keywordMs = keywordPart.keywordMs;
    } else if (input.mode === 'vector') {
      const vectorPart = await this.vectorSearch.search(
        filters,
        processed.embeddingText,
        fetchK,
      );
      vectorHits = vectorPart.hits;
      embeddingMs = vectorPart.embeddingMs;
      vectorMs = vectorPart.vectorMs;
    } else {
      const keywordPart = await this.keywordSearch.search(
        filters,
        processed.tsQuery,
        processed.normalized,
        fetchK,
        processed.expandedTerms,
      );
      keywordHits = keywordPart.hits;
      keywordMs = keywordPart.keywordMs;
    }

    const rankStart = Date.now();
    const chunkIds = [
      ...new Set([
        ...vectorHits.map((h) => h.chunkId),
        ...keywordHits.map((h) => h.chunkId),
      ]),
    ];
    const chunks = await this.repo.hydrateChunks(chunkIds);
    const ranked = this.ranking.mergeAndRank({
      vectorHits,
      keywordHits,
      chunks,
      previewChars: this.repo.previewChars(),
      repositoryPriorityIds: filters.repositoryIds,
      preferSourceCode: this.isCodeIntentQuery(processed.keywords),
      queryTerms: processed.expandedTerms.length
        ? processed.expandedTerms
        : processed.keywords,
    });
    const rankMs = Date.now() - rankStart;

    const total = ranked.length;
    const offset = (input.page - 1) * input.pageSize;
    const pageItems = ranked.slice(offset, offset + input.pageSize);

    const response: SearchResponse = {
      mode: input.mode,
      query: processed,
      results: pageItems,
      pagination: {
        page: input.page,
        pageSize: input.pageSize,
        total,
        hasMore: offset + input.pageSize < total,
      },
      timing: {
        totalMs: Date.now() - started,
        queryMs,
        embeddingMs,
        vectorMs,
        keywordMs,
        rankMs,
        cacheHit: false,
      },
      searchType,
    };

    await this.cache.setResult(cacheHash, searchType, response);
    await this.persistSideEffects(input, processed.raw, response, filters);
    return response;
  }

  private async persistSideEffects(
    input: SearchExecuteInput,
    rawQuery: string,
    response: SearchResponse,
    filters: SearchFilters,
  ): Promise<void> {
    const repositoryId = filters.repositoryIds?.[0] ?? null;

    await Promise.all([
      this.prisma.searchHistory.create({
        data: {
          workspaceId: filters.workspaceId,
          userId: input.userId,
          repositoryId,
          query: rawQuery.slice(0, 1024),
          searchType: response.searchType,
          resultsCount: response.results.length,
          latencyMs: response.timing.totalMs,
          searchFilters: {
            ...filters,
            dateFrom: filters.dateFrom?.toISOString() ?? null,
            dateTo: filters.dateTo?.toISOString() ?? null,
          },
        },
      }),
      this.cache.trackPopular(filters.workspaceId, rawQuery),
      this.metrics.record({
        workspaceId: filters.workspaceId,
        mode: input.mode,
        totalMs: response.timing.totalMs,
        vectorMs: response.timing.vectorMs,
        keywordMs: response.timing.keywordMs,
        embeddingMs: response.timing.embeddingMs,
        cacheHit: response.timing.cacheHit,
        resultsCount: response.results.length,
        repositoryId,
        query: rawQuery,
      }),
    ]);

    this.searchLogger.logSearch({
      workspaceId: filters.workspaceId,
      userId: input.userId,
      mode: input.mode,
      query: rawQuery,
      resultsCount: response.results.length,
      timing: response.timing,
    });
  }

  private toSearchType(mode: SearchMode): SearchType {
    if (mode === 'vector') return SearchType.SEMANTIC;
    if (mode === 'keyword') return SearchType.KEYWORD;
    return SearchType.HYBRID;
  }

  private isCodeIntentQuery(keywords: string[]): boolean {
    return keywords.some((k) => CODE_INTENT_TERMS.has(k.toLowerCase()));
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new RequestTimeoutException(`Search timed out after ${ms}ms`));
      }, ms);
      promise
        .then((value) => {
          clearTimeout(timer);
          resolve(value);
        })
        .catch((error: unknown) => {
          clearTimeout(timer);
          reject(error instanceof Error ? error : new Error(String(error)));
        });
    });
  }
}
