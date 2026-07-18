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
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { AuthenticatedDeveloper } from '../../identity/entities/authenticated-developer.entity';
import { CurrentDeveloper } from '../../identity/decorators/current-developer.decorator';
import { GithubWorkspaceGuard } from '../../github/guards/github-workspace.guard';
import { WorkspacePermission } from '../../workspaces/constants/workspace-permissions.constants';
import { RequireWorkspacePermission } from '../../workspaces/decorators/require-workspace-permission.decorator';
import { PrismaService } from '../../../database/prisma.service';
import { RepositoryPipelineService } from '../services/repository-pipeline.service';
import { RepositorySyncQueueService } from '../jobs/repository-sync-queue.service';
import { SyncCheckpointService } from '../services/sync-checkpoint.service';
import { KnowledgeQueueService } from '../../knowledge/jobs/knowledge-queue.service';

class StartRepositoryPipelineDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  workspaceId!: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}

class PipelineQueryDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  workspaceId!: string;
}

function RequireRepoWorkspace(...permissions: WorkspacePermission[]) {
  return applyDecorators(
    UseGuards(GithubWorkspaceGuard),
    RequireWorkspacePermission(...permissions),
  );
}

@ApiTags('repository-sync')
@ApiBearerAuth('JWT')
@Controller({ path: 'repositories', version: '1' })
export class RepositorySyncController {
  constructor(
    private readonly pipeline: RepositoryPipelineService,
    private readonly queueService: RepositorySyncQueueService,
    private readonly checkpoints: SyncCheckpointService,
    private readonly knowledgeQueue: KnowledgeQueueService,
    private readonly prisma: PrismaService,
  ) {}

  @Post(':id/sync')
  @RequireRepoWorkspace(WorkspacePermission.CREATE_REPOSITORIES)
  @ApiOperation({
    summary:
      'Start full pipeline: entity sync → documentation crawl → knowledge → chunks',
  })
  @ApiParam({ name: 'id', description: 'Repository UUID' })
  @ApiBody({ type: StartRepositoryPipelineDto })
  @ApiResponse({ status: 201 })
  async startSync(
    @Param('id', ParseUUIDPipe) repositoryId: string,
    @Body() body: StartRepositoryPipelineDto,
    @CurrentDeveloper() user: AuthenticatedDeveloper,
  ) {
    return this.pipeline.startPipeline({
      workspaceId: body.workspaceId,
      repositoryId,
      force: body.force,
      triggeredBy: user.id,
    });
  }

  @Post(':id/sync/documentation')
  @RequireRepoWorkspace(WorkspacePermission.CREATE_REPOSITORIES)
  @ApiOperation({ summary: 'Enqueue documentation crawl only' })
  @ApiBody({ type: StartRepositoryPipelineDto })
  async syncDocumentation(
    @Param('id', ParseUUIDPipe) repositoryId: string,
    @Body() body: StartRepositoryPipelineDto,
    @CurrentDeveloper() user: AuthenticatedDeveloper,
  ) {
    const job = await this.queueService.enqueueDocumentationSync({
      workspaceId: body.workspaceId,
      repositoryId,
      force: body.force,
      triggeredBy: user.id,
      continuePipeline: true,
    });
    return { accepted: true, jobId: job.id };
  }

  @Get(':id/sync/status')
  @RequireRepoWorkspace(WorkspacePermission.READ_WORKSPACE)
  @ApiOperation({ summary: 'Pipeline status, checkpoints, and queue depths' })
  @ApiQuery({ name: 'workspaceId', required: true })
  async getStatus(
    @Param('id', ParseUUIDPipe) repositoryId: string,
    @Query() query: PipelineQueryDto,
  ) {
    const repository = await this.prisma.repository.findFirst({
      where: { id: repositoryId, workspaceId: query.workspaceId },
      select: {
        id: true,
        fullName: true,
        lastSyncedAt: true,
        providerMetadata: true,
      },
    });

    const checkpoints = await this.checkpoints.getCheckpoints(repositoryId);
    const [repoQueues, knowledgeQueues] = await Promise.all([
      this.queueService.getQueueCounts(),
      this.knowledgeQueue.getQueueCounts(),
    ]);

    const meta =
      repository?.providerMetadata &&
      typeof repository.providerMetadata === 'object'
        ? (repository.providerMetadata as Record<string, unknown>)
        : {};

    return {
      repositoryId,
      fullName: repository?.fullName,
      lastSyncedAt: repository?.lastSyncedAt,
      pipelineStatus: meta.pipelineStatus ?? null,
      checkpoints,
      queues: {
        repository: repoQueues,
        knowledge: knowledgeQueues,
      },
    };
  }

  @Get('pipeline/statistics')
  @RequireRepoWorkspace(WorkspacePermission.READ_WORKSPACE)
  @ApiOperation({
    summary: 'Workspace-level sync/knowledge pipeline queue statistics',
  })
  @ApiQuery({ name: 'workspaceId', required: true })
  async getStatistics(@Query() query: PipelineQueryDto) {
    const [repoQueues, knowledgeQueues, docs, sources, chunks] =
      await Promise.all([
        this.queueService.getQueueCounts(),
        this.knowledgeQueue.getQueueCounts(),
        this.prisma.documentation.count({
          where: { repository: { workspaceId: query.workspaceId } },
        }),
        this.prisma.knowledgeSource.count({
          where: { workspaceId: query.workspaceId },
        }),
        this.prisma.knowledgeChunk.count({
          where: { workspaceId: query.workspaceId, deletedAt: null },
        }),
      ]);

    return {
      workspaceId: query.workspaceId,
      totals: {
        documentationFiles: docs,
        knowledgeSources: sources,
        activeChunks: chunks,
      },
      queues: {
        repository: repoQueues,
        knowledge: knowledgeQueues,
      },
    };
  }
}
