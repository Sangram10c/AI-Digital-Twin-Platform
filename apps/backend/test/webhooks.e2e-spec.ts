import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { createHmac } from 'crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { WebhookIngestionService } from '../src/modules/webhook/services/webhook-ingestion.service';
import { GithubWebhookController } from '../src/modules/webhook/controllers/github-webhook.controller';
import { JwtAuthGuard } from '../src/modules/identity/guards/jwt-auth.guard';

describe('GitHub webhooks (e2e-lite)', () => {
  let app: INestApplication<App>;
  const ingest = jest.fn();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [GithubWebhookController],
      providers: [
        {
          provide: WebhookIngestionService,
          useValue: { ingest },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication({ rawBody: true });
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    ingest.mockReset();
    ingest.mockResolvedValue({
      accepted: true,
      duplicate: false,
      ignored: false,
      webhookEventId: 'evt-1',
      jobId: 'job-1',
      message: 'Webhook accepted and queued',
    });
  });

  it('POST /api/v1/webhooks/github accepts delivery and returns 202', async () => {
    const body = { zen: 'hello', repository: { id: 1 } };
    const raw = JSON.stringify(body);
    const signature = `sha256=${createHmac('sha256', 'test')
      .update(raw)
      .digest('hex')}`;

    await request(app.getHttpServer())
      .post('/api/v1/webhooks/github')
      .set('Content-Type', 'application/json')
      .set('X-GitHub-Event', 'ping')
      .set('X-GitHub-Delivery', 'delivery-1')
      .set('X-Hub-Signature-256', signature)
      .send(body)
      .expect(202);

    expect(ingest).toHaveBeenCalled();
  });
});
