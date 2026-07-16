import {
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiHeader,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../../../common/decorators/public.decorator';
import { SkipTransform } from '../../../common/decorators/skip-transform.decorator';
import {
  GithubWebhookQueryDto,
  WebhookAcceptResponseDto,
} from '../dto/webhook.dto';
import { WebhookIngestionService } from '../services/webhook-ingestion.service';

@ApiTags('webhooks')
@Controller({ path: 'webhooks', version: '1' })
export class GithubWebhookController {
  constructor(private readonly ingestionService: WebhookIngestionService) {}

  @Public()
  @SkipTransform()
  @Post('github')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Receive GitHub webhook deliveries',
    description: [
      'Public endpoint (no JWT). Verifies `X-Hub-Signature-256` using `GITHUB_WEBHOOK_SECRET`.',
      'Stores the event, enqueues BullMQ work, and returns quickly.',
      'Recommended webhook URL: `/api/v1/webhooks/github?workspaceId=<uuid>&connectedAccountId=<uuid>`',
      'when the hook is not repository-scoped.',
    ].join('\n'),
  })
  @ApiHeader({ name: 'X-GitHub-Event', required: true })
  @ApiHeader({ name: 'X-GitHub-Delivery', required: true })
  @ApiHeader({ name: 'X-Hub-Signature-256', required: true })
  @ApiQuery({ name: 'workspaceId', required: false })
  @ApiQuery({ name: 'connectedAccountId', required: false })
  @ApiResponse({ status: 202, type: WebhookAcceptResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid signature' })
  async receiveGithubWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: GithubWebhookQueryDto,
  ): Promise<WebhookAcceptResponseDto> {
    const rawBody = req.rawBody;
    if (!rawBody || rawBody.length === 0) {
      // Fallback for environments without rawBody middleware
      const fallback = Buffer.from(JSON.stringify(req.body ?? {}), 'utf8');
      return this.ingestionService.ingest({
        rawBody: fallback,
        headers,
        body: req.body,
        workspaceIdHint: query.workspaceId,
        connectedAccountIdHint: query.connectedAccountId,
      });
    }

    return this.ingestionService.ingest({
      rawBody,
      headers,
      body: req.body,
      workspaceIdHint: query.workspaceId,
      connectedAccountIdHint: query.connectedAccountId,
    });
  }
}
