import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { BullMqCoreModule } from '../../common/modules/bullmq-core.module';
import { KnowledgeHeuristicsModule } from '../knowledge-heuristics/knowledge-heuristics.module';
import { AiKnowledgeController } from './controllers/ai-knowledge.controller';
import { AI_KNOWLEDGE_QUEUES } from './constants/ai-knowledge.constants';
import { HYBRID_QUEUES } from './constants/hybrid-pipeline.constants';
import { AiHeuristicsExtractorService } from './extractors/ai-heuristics-extractor.service';
import { AiKnowledgeQueueService } from './jobs/ai-knowledge-queue.service';
import { HybridPipelineQueueService } from './jobs/hybrid-pipeline-queue.service';
import {
  AiCommitAnalysisProcessor,
  AiDeadLetterProcessor,
  AiDocumentAnalysisProcessor,
  AiIssueAnalysisProcessor,
  AiPullRequestAnalysisProcessor,
  AiRepositoryAnalysisProcessor,
  AiRetryProcessor,
} from './processors/ai-knowledge.processors';
import {
  HybridAiExtractionProcessor,
  HybridDigestBuilderProcessor,
  HybridEmbeddingsStubProcessor,
  HybridHeuristicsProcessor,
} from './processors/hybrid-pipeline.processors';
import { AiProvidersService } from './providers/ai-providers.service';
import { AiProviderFallbackService } from './providers/ai-provider-fallback.service';
import { AiProviderRateLimiterService } from './providers/ai-provider-rate-limiter.service';
import { AiKnowledgeExtractionService } from './services/ai-knowledge-extraction.service';
import { AiKnowledgeOrchestrationService } from './services/ai-knowledge-orchestration.service';
import { AiKnowledgeQueryService } from './services/ai-knowledge-query.service';
import { AiKnowledgeStorageService } from './services/ai-knowledge-storage.service';
import { DigestBuilderService } from './services/digest-builder.service';
import { HybridAiOrchestrationService } from './services/hybrid-ai-orchestration.service';
import { HybridAiPipelineService } from './services/hybrid-ai-pipeline.service';
import { KnowledgeAiBridgeService } from './services/knowledge-ai-bridge.service';

const queueNames = [
  ...Object.values(AI_KNOWLEDGE_QUEUES),
  ...Object.values(HYBRID_QUEUES),
];

@Module({
  imports: [
    BullMqCoreModule,
    KnowledgeHeuristicsModule,
    BullModule.registerQueue(...queueNames.map((name) => ({ name }))),
  ],
  controllers: [AiKnowledgeController],
  providers: [
    AiProvidersService,
    AiProviderRateLimiterService,
    AiProviderFallbackService,
    AiHeuristicsExtractorService,
    AiKnowledgeStorageService,
    AiKnowledgeExtractionService,
    AiKnowledgeOrchestrationService,
    AiKnowledgeQueryService,
    AiKnowledgeQueueService,
    DigestBuilderService,
    HybridAiPipelineService,
    HybridAiOrchestrationService,
    HybridPipelineQueueService,
    KnowledgeAiBridgeService,
    AiRepositoryAnalysisProcessor,
    AiCommitAnalysisProcessor,
    AiPullRequestAnalysisProcessor,
    AiIssueAnalysisProcessor,
    AiDocumentAnalysisProcessor,
    AiRetryProcessor,
    AiDeadLetterProcessor,
    HybridHeuristicsProcessor,
    HybridDigestBuilderProcessor,
    HybridAiExtractionProcessor,
    HybridEmbeddingsStubProcessor,
  ],
  exports: [
    AiKnowledgeOrchestrationService,
    AiKnowledgeQueryService,
    AiKnowledgeQueueService,
    KnowledgeAiBridgeService,
    HybridAiOrchestrationService,
    HybridAiPipelineService,
    HybridPipelineQueueService,
  ],
})
export class AiKnowledgeModule {}
