import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { BullMqCoreModule } from '../../common/modules/bullmq-core.module';
import { AiKnowledgeModule } from '../ai-knowledge/ai-knowledge.module';
import { GithubModule } from '../github/github.module';
import { KNOWLEDGE_QUEUES } from './constants/knowledge.constants';
import { LanguageDetectorService } from './extractors/language-detector.service';
import { MetadataExtractorService } from './extractors/metadata-extractor.service';
import { StackExtractorService } from './extractors/stack-extractor.service';
import { KnowledgeQueueService } from './jobs/knowledge-queue.service';
import { KnowledgeController } from './knowledge.controller';
import { ContentCleanerService } from './normalizers/content-cleaner.service';
import { MarkdownParserService } from './parsers/markdown-parser.service';
import {
  ChunkGenerationProcessor,
  CommitKnowledgeProcessor,
  IssueKnowledgeProcessor,
  KnowledgeDeadLetterProcessor,
  PullRequestKnowledgeProcessor,
  ReadmeKnowledgeProcessor,
  RepositoryKnowledgeProcessor,
} from './processors/knowledge.processors';
import { ChunkGenerationService } from './services/chunk-generation.service';
import { DocumentBuilderService } from './services/document-builder.service';
import { KnowledgeChunkerService } from './services/knowledge-chunker.service';
import { KnowledgeProcessingService } from './services/knowledge-processing.service';
import { KnowledgeQueryService } from './services/knowledge-query.service';
import { RepositoryStackService } from './services/repository-stack.service';
import { KnowledgeValidatorService } from './validators/knowledge-validator.service';

const queueNames = Object.values(KNOWLEDGE_QUEUES);

@Module({
  imports: [
    BullMqCoreModule,
    BullModule.registerQueue(...queueNames.map((name) => ({ name }))),
    GithubModule,
    AiKnowledgeModule,
  ],
  controllers: [KnowledgeController],
  providers: [
    ContentCleanerService,
    MarkdownParserService,
    LanguageDetectorService,
    MetadataExtractorService,
    StackExtractorService,
    KnowledgeValidatorService,
    DocumentBuilderService,
    KnowledgeChunkerService,
    ChunkGenerationService,
    RepositoryStackService,
    KnowledgeProcessingService,
    KnowledgeQueryService,
    KnowledgeQueueService,
    RepositoryKnowledgeProcessor,
    CommitKnowledgeProcessor,
    PullRequestKnowledgeProcessor,
    IssueKnowledgeProcessor,
    ReadmeKnowledgeProcessor,
    ChunkGenerationProcessor,
    KnowledgeDeadLetterProcessor,
  ],
  exports: [
    KnowledgeProcessingService,
    KnowledgeQueryService,
    KnowledgeQueueService,
  ],
})
export class KnowledgeModule {}
