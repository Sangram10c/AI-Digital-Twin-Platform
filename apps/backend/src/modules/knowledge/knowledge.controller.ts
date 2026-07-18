import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
  applyDecorators,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentDeveloper } from '../identity/decorators/current-developer.decorator';
import type { AuthenticatedDeveloper } from '../identity/entities/authenticated-developer.entity';
import { GithubWorkspaceGuard } from '../github/guards/github-workspace.guard';
import { WorkspacePermission } from '../workspaces/constants/workspace-permissions.constants';
import { RequireWorkspacePermission } from '../workspaces/decorators/require-workspace-permission.decorator';
import {
  KnowledgeDocumentSummaryDto,
  KnowledgeProcessResponseDto,
  KnowledgeStatisticsQueryDto,
  ListKnowledgeChunksQueryDto,
  ListKnowledgeDocumentsQueryDto,
  ProcessKnowledgeDto,
  ProcessRepositoryKnowledgeDto,
} from './dto/knowledge.dto';
import { KnowledgeProcessingService } from './services/knowledge-processing.service';
import { KnowledgeQueryService } from './services/knowledge-query.service';

function RequireKnowledgeWorkspace(...permissions: WorkspacePermission[]) {
  return applyDecorators(
    UseGuards(GithubWorkspaceGuard),
    RequireWorkspacePermission(...permissions),
  );
}

@ApiTags('knowledge')
@ApiBearerAuth('JWT')
@Controller({ path: 'knowledge', version: '1' })
export class KnowledgeController {
  constructor(
    private readonly processingService: KnowledgeProcessingService,
    private readonly queryService: KnowledgeQueryService,
  ) {}

  @Post('process')
  @RequireKnowledgeWorkspace(WorkspacePermission.CREATE_REPOSITORIES)
  @ApiOperation({
    summary: 'Enqueue knowledge processing for all repositories in a workspace',
  })
  @ApiBody({ type: ProcessKnowledgeDto })
  @ApiResponse({ status: 201, type: KnowledgeProcessResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({
    status: 403,
    description: 'Insufficient workspace permissions',
  })
  async processWorkspace(
    @Body() body: ProcessKnowledgeDto,
    @CurrentDeveloper() developer: AuthenticatedDeveloper,
  ): Promise<KnowledgeProcessResponseDto> {
    const result = await this.processingService.processWorkspace(
      body.workspaceId,
      { triggeredBy: developer.id, force: body.force },
    );

    return {
      accepted: true,
      message: 'Knowledge processing jobs enqueued',
      repositoriesEnqueued: result.repositoriesEnqueued,
    };
  }

  @Post('repository/:id')
  @RequireKnowledgeWorkspace(WorkspacePermission.CREATE_REPOSITORIES)
  @ApiOperation({
    summary: 'Enqueue knowledge processing for a single repository',
  })
  @ApiParam({ name: 'id', description: 'Repository UUID' })
  @ApiBody({ type: ProcessRepositoryKnowledgeDto })
  @ApiResponse({ status: 201, type: KnowledgeProcessResponseDto })
  async processRepository(
    @Param('id', ParseUUIDPipe) repositoryId: string,
    @Body() body: ProcessRepositoryKnowledgeDto,
    @CurrentDeveloper() developer: AuthenticatedDeveloper,
  ): Promise<KnowledgeProcessResponseDto> {
    await this.processingService.processRepository(repositoryId, {
      triggeredBy: developer.id,
      force: body.force,
    });

    return {
      accepted: true,
      message: `Knowledge processing enqueued for repository ${repositoryId}`,
    };
  }

  @Get('documents')
  @RequireKnowledgeWorkspace(WorkspacePermission.READ_WORKSPACE)
  @ApiOperation({ summary: 'List normalized knowledge documents' })
  @ApiQuery({ name: 'workspaceId', required: true })
  @ApiResponse({ status: 200, type: [KnowledgeDocumentSummaryDto] })
  listDocuments(@Query() query: ListKnowledgeDocumentsQueryDto) {
    return this.queryService.listDocuments(query);
  }

  @Get('documents/:id')
  @RequireKnowledgeWorkspace(WorkspacePermission.READ_WORKSPACE)
  @ApiOperation({ summary: 'Get a knowledge document by id' })
  @ApiParam({ name: 'id' })
  @ApiQuery({ name: 'workspaceId', required: true })
  getDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('workspaceId', ParseUUIDPipe) workspaceId: string,
  ) {
    return this.queryService.getDocument(id, workspaceId);
  }

  @Get('chunks')
  @RequireKnowledgeWorkspace(WorkspacePermission.READ_WORKSPACE)
  @ApiOperation({ summary: 'List knowledge chunks' })
  @ApiQuery({ name: 'workspaceId', required: true })
  @ApiResponse({ status: 200, type: [KnowledgeDocumentSummaryDto] })
  listChunks(@Query() query: ListKnowledgeChunksQueryDto) {
    return this.queryService.listChunks(query);
  }

  @Get('chunks/:id')
  @RequireKnowledgeWorkspace(WorkspacePermission.READ_WORKSPACE)
  @ApiOperation({ summary: 'Get a knowledge chunk by id' })
  @ApiParam({ name: 'id' })
  @ApiQuery({ name: 'workspaceId', required: true })
  getChunk(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('workspaceId', ParseUUIDPipe) workspaceId: string,
  ) {
    return this.queryService.getChunk(id, workspaceId);
  }

  @Get('statistics')
  @RequireKnowledgeWorkspace(WorkspacePermission.READ_WORKSPACE)
  @ApiOperation({ summary: 'Knowledge processing statistics and queue depths' })
  @ApiQuery({ name: 'workspaceId', required: true })
  getStatistics(@Query() query: KnowledgeStatisticsQueryDto) {
    return this.queryService.getStatistics(
      query.workspaceId,
      query.repositoryId,
    );
  }
}
