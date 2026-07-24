import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullMqCoreModule } from '../../common/modules/bullmq-core.module';
import {
  EMBEDDING_PROVIDER_TOKEN,
  EMBEDDING_QUEUES,
} from './constants/embeddings.constants';
import { EmbeddingsController } from './embeddings.controller';
import { EmbeddingQueueService } from './jobs/embedding-queue.service';
import { EmbeddingProcessor } from './processors/embedding.processors';
import { createEmbeddingProvider } from './providers/embedding-provider.factory';
import { EmbeddingChecksumService } from './services/embedding-checksum.service';
import { EmbeddingOrchestrationService } from './services/embedding-orchestration.service';
import { EmbeddingQueryService } from './services/embedding-query.service';
import { EmbeddingStorageService } from './services/embedding-storage.service';
import { EmbeddingVectorValidatorService } from './services/embedding-vector-validator.service';
import { EmbeddingsService } from './services/embeddings.service';

@Module({
  imports: [
    ConfigModule,
    BullMqCoreModule,
    BullModule.registerQueue({ name: EMBEDDING_QUEUES.EMBEDDINGS }),
  ],
  controllers: [EmbeddingsController],
  providers: [
    {
      provide: EMBEDDING_PROVIDER_TOKEN,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => createEmbeddingProvider(config),
    },
    EmbeddingChecksumService,
    EmbeddingVectorValidatorService,
    EmbeddingStorageService,
    EmbeddingsService,
    EmbeddingQueueService,
    EmbeddingOrchestrationService,
    EmbeddingQueryService,
    EmbeddingProcessor,
  ],
  exports: [
    EmbeddingsService,
    EmbeddingOrchestrationService,
    EmbeddingQueryService,
    EmbeddingQueueService,
  ],
})
export class EmbeddingsModule {}
