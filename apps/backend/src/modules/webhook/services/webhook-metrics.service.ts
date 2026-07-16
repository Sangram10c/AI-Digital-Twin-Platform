import { Injectable } from '@nestjs/common';

@Injectable()
export class WebhookMetricsService {
  private received = 0;
  private processed = 0;
  private failed = 0;
  private ignored = 0;
  private duplicates = 0;
  private latencySumMs = 0;
  private latencyCount = 0;

  recordReceived(): void {
    this.received += 1;
  }

  recordProcessed(): void {
    this.processed += 1;
  }

  recordFailed(): void {
    this.failed += 1;
  }

  recordIgnored(): void {
    this.ignored += 1;
  }

  recordDuplicate(): void {
    this.duplicates += 1;
  }

  recordLatency(ms: number): void {
    this.latencySumMs += ms;
    this.latencyCount += 1;
  }

  snapshot() {
    return {
      receivedEvents: this.received,
      processedEvents: this.processed,
      failedEvents: this.failed,
      ignoredEvents: this.ignored,
      duplicateEvents: this.duplicates,
      averageIngestLatencyMs:
        this.latencyCount === 0
          ? 0
          : Math.round(this.latencySumMs / this.latencyCount),
    };
  }
}
