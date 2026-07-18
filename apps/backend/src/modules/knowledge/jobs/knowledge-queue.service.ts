import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  DEFAULT_KNOWLEDGE_LIMITS,
  KNOWLEDGE_JOBS,
  KNOWLEDGE_QUEUES,
} from '../constants/knowledge.constants';
import {
  KnowledgeChunkJobPayload,
  KnowledgeDeadLetterPayload,
  KnowledgeEntityJobPayload,
  KnowledgeJobPayload,
  KnowledgeQueueName,
} from '../interfaces/knowledge.interfaces';

@Injectable()
export class KnowledgeQueueService {
  private readonly logger = new Logger(KnowledgeQueueService.name);

  constructor(
    @InjectQueue(KNOWLEDGE_QUEUES.REPOSITORY)
    private readonly repositoryQueue: Queue,
    @InjectQueue(KNOWLEDGE_QUEUES.COMMIT)
    private readonly commitQueue: Queue,
    @InjectQueue(KNOWLEDGE_QUEUES.PULL_REQUEST)
    private readonly pullRequestQueue: Queue,
    @InjectQueue(KNOWLEDGE_QUEUES.ISSUE)
    private readonly issueQueue: Queue,
    @InjectQueue(KNOWLEDGE_QUEUES.README)
    private readonly readmeQueue: Queue,
    @InjectQueue(KNOWLEDGE_QUEUES.CHUNK_GENERATION)
    private readonly chunkQueue: Queue,
    @InjectQueue(KNOWLEDGE_QUEUES.DEAD_LETTER)
    private readonly deadLetterQueue: Queue,
  ) {}

  private defaultJobOptions() {
    return {
      attempts: DEFAULT_KNOWLEDGE_LIMITS.maxRetries,
      backoff: {
        type: 'exponential' as const,
        delay: DEFAULT_KNOWLEDGE_LIMITS.backoffDelayMs,
      },
      removeOnComplete: 200,
      removeOnFail: 500,
    };
  }

  private queueByName(name: KnowledgeQueueName): Queue {
    switch (name) {
      case KNOWLEDGE_QUEUES.REPOSITORY:
        return this.repositoryQueue;
      case KNOWLEDGE_QUEUES.COMMIT:
        return this.commitQueue;
      case KNOWLEDGE_QUEUES.PULL_REQUEST:
        return this.pullRequestQueue;
      case KNOWLEDGE_QUEUES.ISSUE:
        return this.issueQueue;
      case KNOWLEDGE_QUEUES.README:
        return this.readmeQueue;
      case KNOWLEDGE_QUEUES.CHUNK_GENERATION:
        return this.chunkQueue;
      case KNOWLEDGE_QUEUES.DEAD_LETTER:
        return this.deadLetterQueue;
      default:
        return this.repositoryQueue;
    }
  }

  enqueueRepositoryProcessing(payload: KnowledgeJobPayload) {
    return this.repositoryQueue.add(
      KNOWLEDGE_JOBS.PROCESS_REPOSITORY,
      payload,
      {
        ...this.defaultJobOptions(),
        // BullMQ forbids ':' in custom job ids
        jobId: `knowledge-repo-${payload.repositoryId}-${Date.now()}`,
      },
    );
  }

  enqueueCommitProcessing(payload: KnowledgeEntityJobPayload) {
    return this.commitQueue.add(KNOWLEDGE_JOBS.PROCESS_COMMIT, payload, {
      ...this.defaultJobOptions(),
      jobId: `knowledge-commit-${payload.entityId}`,
    });
  }

  enqueuePullRequestProcessing(payload: KnowledgeEntityJobPayload) {
    return this.pullRequestQueue.add(
      KNOWLEDGE_JOBS.PROCESS_PULL_REQUEST,
      payload,
      {
        ...this.defaultJobOptions(),
        jobId: `knowledge-pr-${payload.entityId}`,
      },
    );
  }

  enqueueIssueProcessing(payload: KnowledgeEntityJobPayload) {
    return this.issueQueue.add(KNOWLEDGE_JOBS.PROCESS_ISSUE, payload, {
      ...this.defaultJobOptions(),
      jobId: `knowledge-issue-${payload.entityId}`,
    });
  }

  enqueueReadmeProcessing(
    payload: KnowledgeEntityJobPayload | KnowledgeJobPayload,
  ) {
    const jobId =
      'entityId' in payload && payload.entityId
        ? `knowledge-readme-${payload.entityId}`
        : `knowledge-readme-${payload.repositoryId}`;

    return this.readmeQueue.add(KNOWLEDGE_JOBS.PROCESS_README, payload, {
      ...this.defaultJobOptions(),
      jobId,
    });
  }

  enqueueChunkGeneration(payload: KnowledgeChunkJobPayload) {
    return this.chunkQueue.add(KNOWLEDGE_JOBS.GENERATE_CHUNKS, payload, {
      ...this.defaultJobOptions(),
      jobId: `knowledge-chunk-${payload.documentKind}-${payload.documentId}`,
    });
  }

  enqueueDeadLetter(payload: KnowledgeDeadLetterPayload) {
    this.logger.warn(
      `Dead-letter knowledge job ${payload.jobName} on ${payload.sourceQueue}: ${payload.error}`,
    );
    return this.deadLetterQueue.add(KNOWLEDGE_JOBS.DEAD_LETTER, payload, {
      removeOnComplete: 1_000,
      removeOnFail: 1_000,
    });
  }

  async getQueueCounts() {
    const names = Object.values(KNOWLEDGE_QUEUES);
    const counts: Record<
      string,
      Awaited<ReturnType<Queue['getJobCounts']>>
    > = {};

    for (const name of names) {
      counts[name] = await this.queueByName(name).getJobCounts(
        'waiting',
        'active',
        'completed',
        'failed',
        'delayed',
        'paused',
      );
    }

    return counts;
  }
}
