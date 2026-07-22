import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  AI_KNOWLEDGE_JOBS,
  AI_KNOWLEDGE_LIMITS,
  AI_KNOWLEDGE_QUEUES,
} from '../constants/ai-knowledge.constants';
import {
  AiKnowledgeJobPayload,
  AiRetryJobPayload,
} from '../interfaces/ai-knowledge.interfaces';

@Injectable()
export class AiKnowledgeQueueService {
  constructor(
    @InjectQueue(AI_KNOWLEDGE_QUEUES.REPOSITORY)
    private readonly repositoryQueue: Queue,
    @InjectQueue(AI_KNOWLEDGE_QUEUES.COMMIT)
    private readonly commitQueue: Queue,
    @InjectQueue(AI_KNOWLEDGE_QUEUES.PULL_REQUEST)
    private readonly pullRequestQueue: Queue,
    @InjectQueue(AI_KNOWLEDGE_QUEUES.ISSUE)
    private readonly issueQueue: Queue,
    @InjectQueue(AI_KNOWLEDGE_QUEUES.DOCUMENT)
    private readonly documentQueue: Queue,
    @InjectQueue(AI_KNOWLEDGE_QUEUES.RETRY)
    private readonly retryQueue: Queue,
    @InjectQueue(AI_KNOWLEDGE_QUEUES.DEAD_LETTER)
    private readonly deadLetterQueue: Queue,
  ) {}

  private defaultJobOptions() {
    return {
      attempts: AI_KNOWLEDGE_LIMITS.maxRetries,
      backoff: {
        type: 'exponential' as const,
        delay: AI_KNOWLEDGE_LIMITS.backoffDelayMs,
      },
      removeOnComplete: 200,
      removeOnFail: 500,
    };
  }

  enqueueRepository(payload: AiKnowledgeJobPayload) {
    return this.repositoryQueue.add(
      AI_KNOWLEDGE_JOBS.ANALYZE_REPOSITORY,
      payload,
      {
        ...this.defaultJobOptions(),
        jobId: `ai-repo-${payload.repositoryId}-${Date.now()}`,
      },
    );
  }

  enqueueCommit(payload: AiKnowledgeJobPayload) {
    return this.commitQueue.add(AI_KNOWLEDGE_JOBS.ANALYZE_COMMIT, payload, {
      ...this.defaultJobOptions(),
      jobId: `ai-commit-${payload.documentId}-${Date.now()}`,
    });
  }

  enqueuePullRequest(payload: AiKnowledgeJobPayload) {
    return this.pullRequestQueue.add(
      AI_KNOWLEDGE_JOBS.ANALYZE_PULL_REQUEST,
      payload,
      {
        ...this.defaultJobOptions(),
        jobId: `ai-pr-${payload.documentId}-${Date.now()}`,
      },
    );
  }

  enqueueIssue(payload: AiKnowledgeJobPayload) {
    return this.issueQueue.add(AI_KNOWLEDGE_JOBS.ANALYZE_ISSUE, payload, {
      ...this.defaultJobOptions(),
      jobId: `ai-issue-${payload.documentId}-${Date.now()}`,
    });
  }

  enqueueDocument(payload: AiKnowledgeJobPayload) {
    return this.documentQueue.add(AI_KNOWLEDGE_JOBS.ANALYZE_DOCUMENT, payload, {
      ...this.defaultJobOptions(),
      jobId: `ai-doc-${payload.documentId ?? payload.documentationId}-${Date.now()}`,
    });
  }

  enqueueRetry(payload: AiRetryJobPayload) {
    return this.retryQueue.add(AI_KNOWLEDGE_JOBS.RETRY_ANALYSIS, payload, {
      removeOnComplete: 200,
      removeOnFail: 200,
    });
  }

  enqueueDeadLetter(payload: AiRetryJobPayload) {
    return this.deadLetterQueue.add(AI_KNOWLEDGE_JOBS.DEAD_LETTER, payload, {
      removeOnComplete: 500,
      removeOnFail: 500,
    });
  }

  async getQueueCounts() {
    const entries: Array<[string, Queue]> = [
      [AI_KNOWLEDGE_QUEUES.REPOSITORY, this.repositoryQueue],
      [AI_KNOWLEDGE_QUEUES.COMMIT, this.commitQueue],
      [AI_KNOWLEDGE_QUEUES.PULL_REQUEST, this.pullRequestQueue],
      [AI_KNOWLEDGE_QUEUES.ISSUE, this.issueQueue],
      [AI_KNOWLEDGE_QUEUES.DOCUMENT, this.documentQueue],
      [AI_KNOWLEDGE_QUEUES.RETRY, this.retryQueue],
      [AI_KNOWLEDGE_QUEUES.DEAD_LETTER, this.deadLetterQueue],
    ];

    const empty = {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
      paused: 0,
    };

    const results = await Promise.all(
      entries.map(async ([name, queue]) => {
        try {
          const counts = await Promise.race([
            queue.getJobCounts(
              'waiting',
              'active',
              'completed',
              'failed',
              'delayed',
              'paused',
            ),
            new Promise<never>((_, reject) =>
              setTimeout(
                () => reject(new Error(`Redis timeout for queue ${name}`)),
                2_500,
              ),
            ),
          ]);
          return [name, counts] as const;
        } catch {
          return [name, { ...empty }] as const;
        }
      }),
    );

    return Object.fromEntries(results);
  }
}
