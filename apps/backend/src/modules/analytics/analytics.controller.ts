import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentDeveloper } from '../identity/decorators/current-developer.decorator';
import type { AuthenticatedDeveloper } from '../identity/entities/authenticated-developer.entity';
import { AnalyticsService } from './analytics.service';
import {
  AggregationTriggerDto,
  AnalyticsFilterDto,
} from './dto/analytics-filter.dto';
import {
  AiAnalyticsResponseDto,
  ConversationsAnalyticsResponseDto,
  HealthAnalyticsResponseDto,
  JobsAnalyticsResponseDto,
  KnowledgeAnalyticsResponseDto,
  OverviewResponseDto,
  PlatformAnalyticsResponseDto,
  RagAnalyticsResponseDto,
  RepositoriesAnalyticsResponseDto,
  SearchAnalyticsResponseDto,
} from './dto/analytics-response.dto';

@ApiTags('analytics')
@ApiBearerAuth('JWT')
@Controller({ path: 'workspaces/:workspaceId/analytics', version: '1' })
@UseGuards(RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get workspace analytics overview and KPI summary' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({
    status: 200,
    description: 'Analytics overview response',
    type: OverviewResponseDto,
  })
  async getOverview(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Query() filter: AnalyticsFilterDto,
    @CurrentDeveloper() user: AuthenticatedDeveloper,
  ): Promise<OverviewResponseDto> {
    return this.analyticsService.getOverview(
      workspaceId,
      filter,
      user?.id,
      user?.role,
    );
  }

  @Get('repositories')
  @ApiOperation({ summary: 'Get repository sync and git analytics' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({
    status: 200,
    description: 'Repository analytics',
    type: RepositoriesAnalyticsResponseDto,
  })
  async getRepositories(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Query() filter: AnalyticsFilterDto,
    @CurrentDeveloper() user: AuthenticatedDeveloper,
  ): Promise<RepositoriesAnalyticsResponseDto> {
    return this.analyticsService.getRepositories(
      workspaceId,
      filter,
      user?.id,
      user?.role,
    );
  }

  @Get('knowledge')
  @ApiOperation({ summary: 'Get knowledge base and chunking metrics' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({
    status: 200,
    description: 'Knowledge analytics',
    type: KnowledgeAnalyticsResponseDto,
  })
  async getKnowledge(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Query() filter: AnalyticsFilterDto,
    @CurrentDeveloper() user: AuthenticatedDeveloper,
  ): Promise<KnowledgeAnalyticsResponseDto> {
    return this.analyticsService.getKnowledge(
      workspaceId,
      filter,
      user?.id,
      user?.role,
    );
  }

  @Get('search')
  @ApiOperation({ summary: 'Get search engine performance and query metrics' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({
    status: 200,
    description: 'Search analytics',
    type: SearchAnalyticsResponseDto,
  })
  async getSearch(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Query() filter: AnalyticsFilterDto,
    @CurrentDeveloper() user: AuthenticatedDeveloper,
  ): Promise<SearchAnalyticsResponseDto> {
    return this.analyticsService.getSearch(
      workspaceId,
      filter,
      user?.id,
      user?.role,
    );
  }

  @Get('rag')
  @ApiOperation({ summary: 'Get RAG citation accuracy and grounding metrics' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({
    status: 200,
    description: 'RAG analytics',
    type: RagAnalyticsResponseDto,
  })
  async getRag(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Query() filter: AnalyticsFilterDto,
    @CurrentDeveloper() user: AuthenticatedDeveloper,
  ): Promise<RagAnalyticsResponseDto> {
    return this.analyticsService.getRag(
      workspaceId,
      filter,
      user?.id,
      user?.role,
    );
  }

  @Get('ai')
  @ApiOperation({
    summary: 'Get AI provider token usage, latency and cost metrics',
  })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({
    status: 200,
    description: 'AI usage analytics',
    type: AiAnalyticsResponseDto,
  })
  async getAi(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Query() filter: AnalyticsFilterDto,
    @CurrentDeveloper() user: AuthenticatedDeveloper,
  ): Promise<AiAnalyticsResponseDto> {
    return this.analyticsService.getAi(
      workspaceId,
      filter,
      user?.id,
      user?.role,
    );
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get AI chat and conversation activity metrics' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({
    status: 200,
    description: 'Conversation analytics',
    type: ConversationsAnalyticsResponseDto,
  })
  async getConversations(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Query() filter: AnalyticsFilterDto,
    @CurrentDeveloper() user: AuthenticatedDeveloper,
  ): Promise<ConversationsAnalyticsResponseDto> {
    return this.analyticsService.getConversations(
      workspaceId,
      filter,
      user?.id,
      user?.role,
    );
  }

  @Get('jobs')
  @ApiOperation({ summary: 'Get background job execution and failure metrics' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({
    status: 200,
    description: 'Job analytics',
    type: JobsAnalyticsResponseDto,
  })
  async getJobs(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Query() filter: AnalyticsFilterDto,
    @CurrentDeveloper() user: AuthenticatedDeveloper,
  ): Promise<JobsAnalyticsResponseDto> {
    return this.analyticsService.getJobs(
      workspaceId,
      filter,
      user?.id,
      user?.role,
    );
  }

  @Get('health')
  @ApiOperation({ summary: 'Get system and domain health status' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({
    status: 200,
    description: 'System health report',
    type: HealthAnalyticsResponseDto,
  })
  async getHealth(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Query('repositoryId') repositoryId: string | undefined,
    @CurrentDeveloper() user: AuthenticatedDeveloper,
  ): Promise<HealthAnalyticsResponseDto> {
    return this.analyticsService.getHealth(
      workspaceId,
      repositoryId,
      user?.id,
      user?.role,
    );
  }

  @Post('aggregate')
  @ApiOperation({ summary: 'Trigger asynchronous analytics aggregation job' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({
    status: 202,
    description: 'Aggregation job enqueued',
  })
  async triggerAggregation(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Body() dto: AggregationTriggerDto,
    @CurrentDeveloper() user: AuthenticatedDeveloper,
  ) {
    return this.analyticsService.triggerAggregation(
      workspaceId,
      dto,
      user?.id,
      user?.role,
    );
  }
}

@ApiTags('analytics')
@ApiBearerAuth('JWT')
@Controller({ path: 'analytics', version: '1' })
@UseGuards(RolesGuard)
export class PlatformAnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('platform')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get platform-wide global analytics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Global platform analytics',
    type: PlatformAnalyticsResponseDto,
  })
  async getPlatform(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ): Promise<PlatformAnalyticsResponseDto> {
    return this.analyticsService.getPlatform(
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined,
    );
  }
}
