import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { BullMqCoreModule } from '../../common/modules/bullmq-core.module';
import { GithubModule } from '../github/github.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { RepositoryModule } from '../repository/repository.module';
import { WEBHOOK_QUEUES } from './constants/webhook.constants';
import { GithubWebhookController } from './controllers/github-webhook.controller';
import { WebhookEventsController } from './controllers/webhook-events.controller';
import { WebhookEventRouterService } from './handlers/webhook-event-router.service';
import { WebhookQueueService } from './jobs/webhook-queue.service';
import {
  CommitSyncProcessor,
  IssueSyncProcessor,
  PullRequestSyncProcessor,
  ReleaseSyncProcessor,
  RepositorySyncFromWebhookProcessor,
  StatisticsSyncProcessor,
  WebhookDeadLetterProcessor,
} from './processors/domain-sync.processors';
import { WebhookProcessor } from './processors/webhook.processor';
import { WebhookIngestionService } from './services/webhook-ingestion.service';
import { WebhookKnowledgeBridgeService } from './services/webhook-knowledge-bridge.service';
import { WebhookMetricsService } from './services/webhook-metrics.service';
import { WebhookPayloadSyncService } from './services/webhook-payload-sync.service';
import { WebhookQueryService } from './services/webhook-query.service';
import { WebhookReplayGuardService } from './services/webhook-replay-guard.service';
import { WebhookSignatureService } from './services/webhook-signature.service';
import { WebhookTargetResolverService } from './services/webhook-target-resolver.service';

const queueNames = Object.values(WEBHOOK_QUEUES);

@Module({
  imports: [
    GithubModule,
    KnowledgeModule,
    RepositoryModule,
    BullMqCoreModule,
    BullModule.registerQueue(...queueNames.map((name) => ({ name }))),
  ],
  controllers: [GithubWebhookController, WebhookEventsController],
  providers: [
    WebhookSignatureService,
    WebhookReplayGuardService,
    WebhookTargetResolverService,
    WebhookMetricsService,
    WebhookIngestionService,
    WebhookQueryService,
    WebhookPayloadSyncService,
    WebhookKnowledgeBridgeService,
    WebhookEventRouterService,
    WebhookQueueService,
    WebhookProcessor,
    CommitSyncProcessor,
    PullRequestSyncProcessor,
    IssueSyncProcessor,
    ReleaseSyncProcessor,
    RepositorySyncFromWebhookProcessor,
    StatisticsSyncProcessor,
    WebhookDeadLetterProcessor,
  ],
  exports: [WebhookIngestionService, WebhookQueryService],
})
export class WebhookModule {}
