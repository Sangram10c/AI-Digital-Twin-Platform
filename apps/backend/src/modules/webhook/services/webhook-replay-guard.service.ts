import { Injectable } from '@nestjs/common';
import { DEFAULT_WEBHOOK_LIMITS } from '../constants/webhook.constants';

interface CacheEntry {
  expiresAt: number;
}

/**
 * Fast in-memory replay protection for recent GitHub delivery IDs.
 * Durable idempotency still uses WebhookEvent.providerEventId in Postgres.
 */
@Injectable()
export class WebhookReplayGuardService {
  private readonly seen = new Map<string, CacheEntry>();

  hasSeen(deliveryId: string): boolean {
    this.evictExpired();
    const existing = this.seen.get(deliveryId);
    return Boolean(existing && existing.expiresAt > Date.now());
  }

  remember(deliveryId: string): void {
    this.evictExpired();
    if (this.seen.size >= DEFAULT_WEBHOOK_LIMITS.replayCacheMaxEntries) {
      const firstKey = this.seen.keys().next().value;
      if (firstKey) {
        this.seen.delete(firstKey);
      }
    }
    this.seen.set(deliveryId, {
      expiresAt: Date.now() + DEFAULT_WEBHOOK_LIMITS.replayCacheTtlMs,
    });
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [key, value] of this.seen.entries()) {
      if (value.expiresAt <= now) {
        this.seen.delete(key);
      }
    }
  }
}
