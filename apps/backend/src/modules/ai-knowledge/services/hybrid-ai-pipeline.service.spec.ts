import { AIExtractionMode } from '../constants/hybrid-pipeline.constants';
import { HybridAiPipelineService } from './hybrid-ai-pipeline.service';

describe('HybridAiPipelineService', () => {
  const prisma = {
    repository: { findFirstOrThrow: jest.fn() },
    heuristicMetadata: { findUnique: jest.fn() },
    repositoryDigest: { findFirst: jest.fn() },
    documentationDigest: { findMany: jest.fn() },
    releaseDigest: { findMany: jest.fn() },
    pullRequestDigest: { findMany: jest.fn() },
    moduleDigest: { findMany: jest.fn() },
    aIAnalysis: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    aIExecutionLog: { create: jest.fn() },
  };
  const configService = {
    get: jest.fn((key: string) => {
      if (key === 'ai.extractionMode') return 'light';
      if (key === 'ai.prBatchSize') return 5;
      return undefined;
    }),
  };
  const heuristics = {
    extractForRepository: jest.fn(),
  };
  const digestBuilder = {
    buildForRepository: jest.fn(),
  };
  const providerFallback = {
    generateWithFallback: jest.fn(),
  };

  let service: HybridAiPipelineService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new HybridAiPipelineService(
      prisma as never,
      configService as never,
      heuristics as never,
      digestBuilder as never,
      providerFallback as never,
    );
  });

  it('resolves extraction modes', () => {
    expect(service.resolveMode('heuristics_only')).toBe(
      AIExtractionMode.HEURISTICS_ONLY,
    );
    expect(service.resolveMode('FULL')).toBe(AIExtractionMode.FULL);
    expect(service.resolveMode()).toBe(AIExtractionMode.LIGHT);
  });

  it('runs heuristics-only without calling AI', async () => {
    prisma.repository.findFirstOrThrow.mockResolvedValue({
      id: 'repo-1',
      workspaceId: 'ws-1',
    });
    heuristics.extractForRepository.mockResolvedValue({
      frameworks: ['NestJS'],
      modules: [],
      technologies: [],
      confidenceScore: 0.5,
      riskScore: 0.1,
    });
    digestBuilder.buildForRepository.mockResolvedValue({
      repositoryDigestId: 'rd-1',
      moduleDigestIds: [],
      pullRequestDigestIds: [],
      documentationDigestIds: [],
      releaseDigestIds: [],
      cacheHits: 1,
      built: 0,
    });
    prisma.aIExecutionLog.create.mockResolvedValue({});

    const result = await service.runForRepository({
      repositoryId: 'repo-1',
      workspaceId: 'ws-1',
      mode: 'HEURISTICS_ONLY',
    });

    expect(result.heuristicsOnly).toBe(true);
    expect(providerFallback.generateWithFallback).not.toHaveBeenCalled();
    expect(result.analysesCompleted).toBe(0);
  });
});
