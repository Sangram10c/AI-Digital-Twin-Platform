import { createHmac } from 'crypto';
import { WebhookSignatureService } from './webhook-signature.service';
import { WebhookEventRouterService } from '../handlers/webhook-event-router.service';
import { WEBHOOK_QUEUES } from '../constants/webhook.constants';
import { WebhookReplayGuardService } from './webhook-replay-guard.service';

describe('WebhookSignatureService', () => {
  const configService = {
    get: jest.fn().mockReturnValue('test-secret'),
  };
  const service = new WebhookSignatureService(configService as never);

  it('accepts a valid X-Hub-Signature-256', () => {
    const rawBody = Buffer.from('{"zen":"test"}', 'utf8');
    const hash = createHmac('sha256', 'test-secret')
      .update(rawBody)
      .digest('hex');

    expect(() =>
      service.verifySignature(rawBody, `sha256=${hash}`),
    ).not.toThrow();
  });

  it('rejects an invalid signature', () => {
    const rawBody = Buffer.from('{"zen":"test"}', 'utf8');
    expect(() => service.verifySignature(rawBody, 'sha256=deadbeef')).toThrow(
      /Invalid webhook signature/,
    );
  });

  it('rejects missing signature header', () => {
    expect(() => service.verifySignature(Buffer.from('{}'), undefined)).toThrow(
      /Missing/,
    );
  });
});

describe('WebhookEventRouterService', () => {
  const router = new WebhookEventRouterService();

  it('routes push to commit sync queue', () => {
    const route = router.route('push');
    expect(route?.queue).toBe(WEBHOOK_QUEUES.COMMIT_SYNC);
  });

  it('routes pull_request to PR sync queue', () => {
    const route = router.route('pull_request');
    expect(route?.queue).toBe(WEBHOOK_QUEUES.PR_SYNC);
  });

  it('ignores ping (no domain job)', () => {
    expect(router.route('ping')).toBeNull();
  });

  it('returns null for unknown events', () => {
    expect(router.route('membership')).toBeNull();
  });
});

describe('WebhookReplayGuardService', () => {
  it('detects duplicate delivery ids', () => {
    const guard = new WebhookReplayGuardService();
    expect(guard.hasSeen('d-1')).toBe(false);
    guard.remember('d-1');
    expect(guard.hasSeen('d-1')).toBe(true);
  });
});
