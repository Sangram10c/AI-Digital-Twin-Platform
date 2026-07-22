import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AIAnalysisStatus,
  AIExtractionMode as PrismaAIExtractionMode,
  DigestKind,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import {
  AIExtractionMode,
  HYBRID_DEFAULTS,
} from '../constants/hybrid-pipeline.constants';
import { KnowledgeHeuristicsService } from '../../knowledge-heuristics/services/knowledge-heuristics.service';
import { DigestBuilderService } from './digest-builder.service';
import { AiProviderFallbackService } from '../providers/ai-provider-fallback.service';
import {
  buildSystemPrompt,
  buildUserPrompt,
} from '../prompts/ai-knowledge.prompts';
import type { SupportedAiProvider } from '../interfaces/ai-knowledge.interfaces';

export interface HybridPipelineResult {
  repositoryId: string;
  workspaceId: string;
  mode: AIExtractionMode;
  heuristicsOnly: boolean;
  digestsBuilt: number;
  digestCacheHits: number;
  analysesCompleted: number;
  analysesSkipped: number;
  analysesFallback: number;
  apiCalls: number;
  fallbackCount: number;
  failedProviders: number;
  averageAiTimeMs: number;
}

interface DigestTarget {
  digestKind: DigestKind;
  digestId: string;
  title: string;
  summaryText: string;
  contentChecksum: string;
  analysisKind: 'repository' | 'document' | 'pull_request';
}

@Injectable()
export class HybridAiPipelineService {
  private readonly logger = new Logger(HybridAiPipelineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly heuristics: KnowledgeHeuristicsService,
    private readonly digestBuilder: DigestBuilderService,
    private readonly providerFallback: AiProviderFallbackService,
  ) {}

  resolveMode(explicit?: string | AIExtractionMode): AIExtractionMode {
    if (explicit) {
      const normalized = String(explicit).toUpperCase().replace(/-/g, '_');
      if (normalized === 'HEURISTICS_ONLY' || normalized === 'HEURISTICS') {
        return AIExtractionMode.HEURISTICS_ONLY;
      }
      if (normalized === 'FULL') return AIExtractionMode.FULL;
      if (normalized === 'LIGHT') return AIExtractionMode.LIGHT;
    }
    const configured = (
      this.configService.get<string>('ai.extractionMode') ?? 'light'
    ).toUpperCase();
    if (configured === 'HEURISTICS_ONLY')
      return AIExtractionMode.HEURISTICS_ONLY;
    if (configured === 'FULL') return AIExtractionMode.FULL;
    return AIExtractionMode.LIGHT;
  }

  async runForRepository(params: {
    repositoryId: string;
    workspaceId: string;
    mode?: string | AIExtractionMode;
    provider?: SupportedAiProvider;
    force?: boolean;
  }): Promise<HybridPipelineResult> {
    const mode = this.resolveMode(params.mode);
    const repository = await this.prisma.repository.findFirstOrThrow({
      where: {
        id: params.repositoryId,
        workspaceId: params.workspaceId,
        deletedAt: null,
      },
    });

    const heuristicsResult = await this.heuristics.extractForRepository(
      repository.id,
    );
    const digests = await this.digestBuilder.buildForRepository(
      repository.id,
      heuristicsResult,
      {
        mode: mode === AIExtractionMode.FULL ? 'FULL' : 'LIGHT',
        prBatchSize:
          this.configService.get<number>('ai.prBatchSize') ??
          HYBRID_DEFAULTS.prBatchSize,
      },
    );

    const metrics: HybridPipelineResult = {
      repositoryId: repository.id,
      workspaceId: repository.workspaceId,
      mode,
      heuristicsOnly: mode === AIExtractionMode.HEURISTICS_ONLY,
      digestsBuilt: digests.built,
      digestCacheHits: digests.cacheHits,
      analysesCompleted: 0,
      analysesSkipped: 0,
      analysesFallback: 0,
      apiCalls: 0,
      fallbackCount: 0,
      failedProviders: 0,
      averageAiTimeMs: 0,
    };

    if (mode === AIExtractionMode.HEURISTICS_ONLY) {
      await this.writeExecutionLog(metrics, heuristicsResult.confidenceScore);
      return metrics;
    }

    const aiMetrics = await this.runAiOnRepositoryDigests({
      workspaceId: repository.workspaceId,
      repositoryId: repository.id,
      mode,
      provider: params.provider,
      force: params.force ?? false,
    });

    Object.assign(metrics, {
      analysesCompleted: aiMetrics.analysesCompleted,
      analysesSkipped: aiMetrics.analysesSkipped,
      analysesFallback: aiMetrics.analysesFallback,
      apiCalls: aiMetrics.apiCalls,
      fallbackCount: aiMetrics.fallbackCount,
      failedProviders: aiMetrics.failedProviders,
      averageAiTimeMs: aiMetrics.averageAiTimeMs,
    });

    await this.writeExecutionLog(metrics, heuristicsResult.confidenceScore);
    this.logger.log(
      `Hybrid pipeline completed for ${repository.id} mode=${mode} ai=${metrics.analysesCompleted} skipped=${metrics.analysesSkipped}`,
    );
    return metrics;
  }

  /**
   * AI stage only — assumes heuristics + digests already exist.
   * Used by the BullMQ chain so failed AI retries do not rebuild digests.
   */
  async runAiOnRepositoryDigests(params: {
    workspaceId: string;
    repositoryId: string;
    mode?: string | AIExtractionMode;
    provider?: SupportedAiProvider;
    force?: boolean;
  }): Promise<
    Pick<
      HybridPipelineResult,
      | 'analysesCompleted'
      | 'analysesSkipped'
      | 'analysesFallback'
      | 'apiCalls'
      | 'fallbackCount'
      | 'failedProviders'
      | 'averageAiTimeMs'
    >
  > {
    const mode = this.resolveMode(params.mode);
    const heuristicsRow = await this.prisma.heuristicMetadata.findUnique({
      where: { repositoryId: params.repositoryId },
    });
    const heuristicsSnapshot = {
      frameworks: heuristicsRow?.frameworks ?? [],
      modules: heuristicsRow?.modules ?? [],
      technologies: heuristicsRow?.technologies ?? [],
      confidenceScore: heuristicsRow?.confidenceScore ?? 0,
      riskScore: heuristicsRow?.riskScore ?? 0,
    };

    const targets = await this.loadDigestTargets(params.repositoryId, mode);
    const metrics = {
      analysesCompleted: 0,
      analysesSkipped: 0,
      analysesFallback: 0,
      apiCalls: 0,
      fallbackCount: 0,
      failedProviders: 0,
      averageAiTimeMs: 0,
    };

    if (mode === AIExtractionMode.HEURISTICS_ONLY || targets.length === 0) {
      return metrics;
    }

    let totalLatency = 0;
    let latencySamples = 0;

    for (const target of targets) {
      const outcome = await this.analyzeDigest({
        workspaceId: params.workspaceId,
        repositoryId: params.repositoryId,
        mode,
        target,
        provider: params.provider,
        force: params.force ?? false,
        heuristicsSnapshot,
      });

      if (outcome.status === 'SKIPPED') metrics.analysesSkipped += 1;
      if (outcome.status === 'COMPLETED') metrics.analysesCompleted += 1;
      if (outcome.status === 'HEURISTICS_FALLBACK') {
        metrics.analysesFallback += 1;
      }
      metrics.apiCalls += outcome.apiCalls;
      metrics.fallbackCount += outcome.fallbackCount;
      metrics.failedProviders += outcome.failedProviders;
      if (outcome.latencyMs) {
        totalLatency += outcome.latencyMs;
        latencySamples += 1;
      }
    }

    metrics.averageAiTimeMs =
      latencySamples > 0 ? Math.round(totalLatency / latencySamples) : 0;
    return metrics;
  }

  private async loadDigestTargets(
    repositoryId: string,
    mode: AIExtractionMode,
  ): Promise<DigestTarget[]> {
    const targets: DigestTarget[] = [];

    const repoDigest = await this.prisma.repositoryDigest.findFirst({
      where: { repositoryId },
      orderBy: { updatedAt: 'desc' },
    });
    if (repoDigest) {
      targets.push({
        digestKind: DigestKind.REPOSITORY,
        digestId: repoDigest.id,
        title: repoDigest.title,
        summaryText: repoDigest.summaryText,
        contentChecksum: repoDigest.contentChecksum,
        analysisKind: 'repository',
      });
    }

    const docDigests = await this.prisma.documentationDigest.findMany({
      where: { repositoryId },
      orderBy: { updatedAt: 'desc' },
      take: mode === AIExtractionMode.FULL ? 50 : 15,
    });
    for (const doc of docDigests) {
      targets.push({
        digestKind: DigestKind.DOCUMENTATION,
        digestId: doc.id,
        title: doc.title,
        summaryText: doc.summaryText,
        contentChecksum: doc.contentChecksum,
        analysisKind: 'document',
      });
    }

    const releaseDigests = await this.prisma.releaseDigest.findMany({
      where: { repositoryId },
      orderBy: { updatedAt: 'desc' },
      take: mode === AIExtractionMode.FULL ? 40 : 10,
    });
    for (const release of releaseDigests) {
      targets.push({
        digestKind: DigestKind.RELEASE,
        digestId: release.id,
        title: release.title,
        summaryText: release.summaryText,
        contentChecksum: release.contentChecksum,
        analysisKind: 'document',
      });
    }

    const prDigests = await this.prisma.pullRequestDigest.findMany({
      where: { repositoryId },
      orderBy: { updatedAt: 'desc' },
      take: mode === AIExtractionMode.LIGHT ? 3 : 20,
    });
    for (const pr of prDigests) {
      targets.push({
        digestKind: DigestKind.PULL_REQUEST,
        digestId: pr.id,
        title: pr.title,
        summaryText: pr.summaryText,
        contentChecksum: pr.contentChecksum,
        analysisKind: 'pull_request',
      });
    }

    if (mode === AIExtractionMode.FULL) {
      const moduleDigests = await this.prisma.moduleDigest.findMany({
        where: { repositoryId },
        orderBy: { updatedAt: 'desc' },
      });
      for (const moduleDigest of moduleDigests) {
        targets.push({
          digestKind: DigestKind.MODULE,
          digestId: moduleDigest.id,
          title: moduleDigest.title,
          summaryText: moduleDigest.summaryText,
          contentChecksum: moduleDigest.contentChecksum,
          analysisKind: 'repository',
        });
      }
    }

    return targets;
  }

  private async analyzeDigest(params: {
    workspaceId: string;
    repositoryId: string;
    mode: AIExtractionMode;
    target: DigestTarget;
    provider?: SupportedAiProvider;
    force: boolean;
    heuristicsSnapshot: Record<string, unknown>;
  }): Promise<{
    status: 'COMPLETED' | 'SKIPPED' | 'HEURISTICS_FALLBACK' | 'FAILED';
    apiCalls: number;
    fallbackCount: number;
    failedProviders: number;
    latencyMs: number;
  }> {
    const existing = await this.prisma.aIAnalysis.findFirst({
      where: {
        repositoryId: params.repositoryId,
        digestKind: params.target.digestKind,
        contentChecksum: params.target.contentChecksum,
        status: {
          in: [
            AIAnalysisStatus.COMPLETED,
            AIAnalysisStatus.HEURISTICS_FALLBACK,
          ],
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (existing && !params.force) {
      return {
        status: 'SKIPPED',
        apiCalls: 0,
        fallbackCount: 0,
        failedProviders: 0,
        latencyMs: 0,
      };
    }

    const analysis = await this.prisma.aIAnalysis.create({
      data: {
        workspaceId: params.workspaceId,
        repositoryId: params.repositoryId,
        digestKind: params.target.digestKind,
        mode: params.mode as PrismaAIExtractionMode,
        status: AIAnalysisStatus.PROCESSING,
        contentChecksum: params.target.contentChecksum,
        ...this.digestForeignKeys(params.target),
      },
    });

    const systemPrompt = buildSystemPrompt(params.target.analysisKind);
    const userPrompt = buildUserPrompt({
      kind: params.target.analysisKind,
      title: params.target.title,
      metadata: {
        digestKind: params.target.digestKind,
        heuristics: params.heuristicsSnapshot,
        note: 'Analyze this compressed digest only. Do not invent facts absent from the digest.',
      },
      content: params.target.summaryText.slice(0, 14_000),
    });

    const result = await this.providerFallback.generateWithFallback(
      {
        provider: params.provider,
        systemPrompt,
        userPrompt,
        temperature: 0.1,
      },
      {
        workspaceId: params.workspaceId,
        aiAnalysisId: analysis.id,
      },
    );

    if (!result.allCloudProvidersFailed) {
      await this.prisma.aIAnalysis.update({
        where: { id: analysis.id },
        data: {
          status: AIAnalysisStatus.COMPLETED,
          provider: result.provider,
          model: result.model,
          rawText: result.rawText.slice(0, 50_000),
          result: result.output as Prisma.InputJsonValue,
          latencyMs: result.latencyMs,
          errorMessage: null,
        },
      });
      return {
        status: 'COMPLETED',
        apiCalls: result.attemptedProviders.length,
        fallbackCount: result.fallbackUsed ? 1 : 0,
        failedProviders: result.failedProviders.length,
        latencyMs: result.latencyMs,
      };
    }

    // Cloud quotas exhausted → heuristics first
    const heuristicsOk = !this.providerFallback.isHeuristicsInsufficient(
      params.heuristicsSnapshot,
    );

    if (heuristicsOk) {
      await this.prisma.aIAnalysis.update({
        where: { id: analysis.id },
        data: {
          status: AIAnalysisStatus.HEURISTICS_FALLBACK,
          provider: null,
          model: null,
          result: {
            source: 'heuristics',
            ...params.heuristicsSnapshot,
            summary:
              'All cloud AI providers unavailable; deterministic heuristics retained as knowledge.',
          },
          errorMessage: result.failedProviders
            .map((f) => `${f.provider}: ${f.error}`)
            .join(' | ')
            .slice(0, 4000),
          latencyMs: 0,
        },
      });
      return {
        status: 'HEURISTICS_FALLBACK',
        apiCalls: result.attemptedProviders.length,
        fallbackCount: 1,
        failedProviders: result.failedProviders.length,
        latencyMs: 0,
      };
    }

    // Heuristics insufficient → Ollama last resort (non-production only)
    const ollama = await this.providerFallback.tryOllamaLastResort(
      {
        systemPrompt,
        userPrompt,
        temperature: 0.1,
      },
      {
        workspaceId: params.workspaceId,
        aiAnalysisId: analysis.id,
      },
    );

    if (ollama && !ollama.allProvidersFailed) {
      await this.prisma.aIAnalysis.update({
        where: { id: analysis.id },
        data: {
          status: AIAnalysisStatus.COMPLETED,
          provider: 'ollama',
          model: ollama.model,
          rawText: ollama.rawText.slice(0, 50_000),
          result: {
            ...ollama.output,
            source: 'ollama_last_resort',
          },
          latencyMs: ollama.latencyMs,
          errorMessage: null,
        },
      });
      return {
        status: 'COMPLETED',
        apiCalls: result.attemptedProviders.length + 1,
        fallbackCount: 2,
        failedProviders: result.failedProviders.length,
        latencyMs: ollama.latencyMs,
      };
    }

    // Final: still store heuristics (even if thin) so pipeline never fails
    await this.prisma.aIAnalysis.update({
      where: { id: analysis.id },
      data: {
        status: AIAnalysisStatus.HEURISTICS_FALLBACK,
        provider: null,
        model: null,
        result: {
          source: 'heuristics_thin',
          ...params.heuristicsSnapshot,
          summary:
            'Cloud AI and Ollama unavailable; thin heuristics retained. Pipeline continued.',
        },
        errorMessage: result.failedProviders
          .map((f) => `${f.provider}: ${f.error}`)
          .join(' | ')
          .slice(0, 4000),
        latencyMs: 0,
      },
    });
    return {
      status: 'HEURISTICS_FALLBACK',
      apiCalls: result.attemptedProviders.length,
      fallbackCount: 1,
      failedProviders: result.failedProviders.length,
      latencyMs: 0,
    };
  }

  private digestForeignKeys(target: DigestTarget) {
    switch (target.digestKind) {
      case DigestKind.REPOSITORY:
        return { repositoryDigestId: target.digestId };
      case DigestKind.MODULE:
        return { moduleDigestId: target.digestId };
      case DigestKind.PULL_REQUEST:
        return { pullRequestDigestId: target.digestId };
      case DigestKind.DOCUMENTATION:
        return { documentationDigestId: target.digestId };
      case DigestKind.RELEASE:
        return { releaseDigestId: target.digestId };
      default:
        return {};
    }
  }

  private async writeExecutionLog(
    metrics: HybridPipelineResult,
    heuristicCoverage: number,
  ) {
    await this.prisma.aIExecutionLog.create({
      data: {
        workspaceId: metrics.workspaceId,
        repositoryId: metrics.repositoryId,
        mode: metrics.mode,
        apiCalls: metrics.apiCalls,
        tokenUsage: 0,
        estimatedCostUsd: 0,
        failedProviders: metrics.failedProviders,
        fallbackCount: metrics.fallbackCount,
        digestCacheHits: metrics.digestCacheHits,
        heuristicCoverage,
        averageAiTimeMs: metrics.averageAiTimeMs,
        metadata: {
          digestsBuilt: metrics.digestsBuilt,
          analysesCompleted: metrics.analysesCompleted,
          analysesSkipped: metrics.analysesSkipped,
          analysesFallback: metrics.analysesFallback,
          heuristicsOnly: metrics.heuristicsOnly,
        },
      },
    });
  }
}
