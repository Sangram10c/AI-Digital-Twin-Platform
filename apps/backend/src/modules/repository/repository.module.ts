import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { BullMqCoreModule } from '../../common/modules/bullmq-core.module';
import { GithubModule } from '../github/github.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { REPOSITORY_QUEUES } from './constants/repository-sync.constants';
import { RepositorySyncController } from './controllers/repository-sync.controller';
import { RepositorySyncQueueService } from './jobs/repository-sync-queue.service';
import {
  DocumentationSyncProcessor,
  RepositoryDeadLetterProcessor,
  RepositoryEntitySyncProcessor,
  RepositoryPipelineProcessor,
} from './processors/repository-sync.processors';
import { DocumentationCrawlerService } from './services/documentation-crawler.service';
import { RepositoryEntitySyncService } from './services/repository-entity-sync.service';
import { RepositoryPipelineService } from './services/repository-pipeline.service';
import { SyncCheckpointService } from './services/sync-checkpoint.service';

const queueNames = Object.values(REPOSITORY_QUEUES);

@Module({
  imports: [
    BullMqCoreModule,
    BullModule.registerQueue(...queueNames.map((name) => ({ name }))),
    GithubModule,
    KnowledgeModule,
  ],
  controllers: [RepositorySyncController],
  providers: [
    SyncCheckpointService,
    DocumentationCrawlerService,
    RepositoryEntitySyncService,
    RepositoryPipelineService,
    RepositorySyncQueueService,
    RepositoryPipelineProcessor,
    RepositoryEntitySyncProcessor,
    DocumentationSyncProcessor,
    RepositoryDeadLetterProcessor,
  ],
  exports: [
    RepositoryPipelineService,
    RepositorySyncQueueService,
    DocumentationCrawlerService,
  ],
})
export class RepositoryModule {}
