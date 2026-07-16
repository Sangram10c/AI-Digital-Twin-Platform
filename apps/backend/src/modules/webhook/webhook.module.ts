import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GithubModule } from '../github/github.module';
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
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const url = configService.get<string>('bullmq.connection.url');
        if (url) {
          return {
            connection: { url },
            prefix: configService.get<string>('bullmq.prefix') ?? 'ai-twin',
          };
        }

        return {
          connection: {
            host:
              configService.get<string>('bullmq.connection.host') ??
              'localhost',
            port: configService.get<number>('bullmq.connection.port') ?? 6379,
            password: configService.get<string>('bullmq.connection.password'),
            db: configService.get<number>('bullmq.connection.db') ?? 0,
          },
          prefix: configService.get<string>('bullmq.prefix') ?? 'ai-twin',
        };
      },
    }),
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
