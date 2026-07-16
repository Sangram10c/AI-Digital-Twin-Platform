import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
  applyDecorators,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { WorkspacePermission } from '../../workspaces/constants/workspace-permissions.constants';
import { RequireWorkspacePermission } from '../../workspaces/decorators/require-workspace-permission.decorator';
import { GithubWorkspaceGuard } from '../../github/guards/github-workspace.guard';
import {
  ListWebhookEventsQueryDto,
  WebhookEventSummaryDto,
  WebhookStatisticsQueryDto,
} from '../dto/webhook.dto';
import { WebhookQueryService } from '../services/webhook-query.service';

function RequireWebhookWorkspace(...permissions: WorkspacePermission[]) {
  return applyDecorators(
    UseGuards(GithubWorkspaceGuard),
    RequireWorkspacePermission(...permissions),
  );
}

@ApiTags('webhooks')
@ApiBearerAuth('JWT')
@Controller({ path: 'webhooks', version: '1' })
export class WebhookEventsController {
  constructor(private readonly queryService: WebhookQueryService) {}

  @Get('events')
  @RequireWebhookWorkspace(WorkspacePermission.READ_WORKSPACE)
  @ApiOperation({
    summary: 'List stored GitHub webhook events for a workspace',
  })
  @ApiQuery({ name: 'workspaceId', required: true })
  @ApiResponse({ status: 200, type: [WebhookEventSummaryDto] })
  listEvents(@Query() query: ListWebhookEventsQueryDto) {
    return this.queryService.listEvents(query);
  }

  @Get('events/:id')
  @RequireWebhookWorkspace(WorkspacePermission.READ_WORKSPACE)
  @ApiOperation({ summary: 'Get a webhook event by id (includes payload)' })
  @ApiParam({ name: 'id' })
  @ApiQuery({ name: 'workspaceId', required: true })
  getEvent(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('workspaceId') workspaceId: string,
  ) {
    return this.queryService.getEvent(id, workspaceId);
  }

  @Get('statistics')
  @RequireWebhookWorkspace(WorkspacePermission.READ_WORKSPACE)
  @ApiOperation({
    summary: 'Webhook processing statistics and queue depths',
  })
  @ApiQuery({ name: 'workspaceId', required: true })
  getStatistics(@Query() query: WebhookStatisticsQueryDto) {
    return this.queryService.getStatistics(query.workspaceId);
  }
}
