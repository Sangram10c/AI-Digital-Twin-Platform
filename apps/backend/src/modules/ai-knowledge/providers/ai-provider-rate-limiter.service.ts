import { Injectable } from '@nestjs/common';
import { AI_KNOWLEDGE_LIMITS } from '../constants/ai-knowledge.constants';

/**
 * Simple global throttle for LLM calls (free-tier safe).
 * Serializes provider requests with a minimum gap between calls.
 */
@Injectable()
export class AiProviderRateLimiterService {
  private chain: Promise<void> = Promise.resolve();
  private lastCallAt = 0;

  async schedule<T>(fn: () => Promise<T>): Promise<T> {
    const run = this.chain.then(async () => {
      const minGapMs = AI_KNOWLEDGE_LIMITS.minProviderGapMs;
      const wait = Math.max(0, this.lastCallAt + minGapMs - Date.now());
      if (wait > 0) {
        await new Promise((resolve) => setTimeout(resolve, wait));
      }
      this.lastCallAt = Date.now();
      return fn();
    });

    this.chain = run.then(
      () => undefined,
      () => undefined,
    );

    return run;
  }
}
