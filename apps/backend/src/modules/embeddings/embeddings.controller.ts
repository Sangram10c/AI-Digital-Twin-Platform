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
  ApiTags,
} from '@nestjs/swagger';
import { GithubWorkspaceGuard } from '../github/guards/github-workspace.guard';
import { WorkspacePermission } from '../workspaces/constants/workspace-permissions.constants';
import { RequireWorkspacePermission } from '../workspaces/decorators/require-workspace-permission.decorator';
import {
  EmbeddingStatisticsQueryDto,
  EmbeddingWorkspaceQueryDto,
  GenerateEmbeddingsDto,
} from './dto/embeddings.dto';
import { EmbeddingOrchestrationService } from './services/embedding-orchestration.service';
import { EmbeddingQueryService } from './services/embedding-query.service';
import { EmbeddingQueueService } from './jobs/embedding-queue.service';

function RequireEmbeddingWorkspace(...permissions: WorkspacePermission[]) {
  return applyDecorators(
    UseGuards(GithubWorkspaceGuard),
    RequireWorkspacePermission(...permissions),
  );
}

@ApiTags('embeddings')
@ApiBearerAuth('JWT')
@Controller({ path: 'embeddings', version: '1' })
export class EmbeddingsController {
  constructor(
    private readonly orchestration: EmbeddingOrchestrationService,
    private readonly query: EmbeddingQueryService,
    private readonly queue: EmbeddingQueueService,
  ) {}

  @Post('generate')
  @RequireEmbeddingWorkspace(WorkspacePermission.CREATE_REPOSITORIES)
  @ApiOperation({
    summary: 'Enqueue embedding generation for a workspace (or repository)',
  })
  @ApiBody({ type: GenerateEmbeddingsDto })
  generate(@Body() body: GenerateEmbeddingsDto) {
    if (body.repositoryId) {
      return this.orchestration.enqueueRepository(
        body.repositoryId,
        body.workspaceId,
        { force: body.force, provider: body.provider },
      );
    }
    return this.orchestration.enqueueWorkspace(body.workspaceId, {
      force: body.force,
      provider: body.provider,
    });
  }

  @Post('repository/:id')
  @RequireEmbeddingWorkspace(WorkspacePermission.CREATE_REPOSITORIES)
  @ApiOperation({ summary: 'Enqueue embeddings for one repository' })
  @ApiParam({ name: 'id', description: 'Repository id' })
  @ApiBody({ type: GenerateEmbeddingsDto })
  generateRepository(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: GenerateEmbeddingsDto,
  ) {
    return this.orchestration.enqueueRepository(id, body.workspaceId, {
      force: body.force,
      provider: body.provider,
    });
  }

  @Get('status/:repositoryId')
  @RequireEmbeddingWorkspace(WorkspacePermission.READ_WORKSPACE)
  @ApiOperation({ summary: 'Embedding status for a repository' })
  @ApiParam({ name: 'repositoryId' })
  @ApiQuery({ name: 'workspaceId', required: true })
  status(
    @Param('repositoryId', ParseUUIDPipe) repositoryId: string,
    @Query() _query: EmbeddingWorkspaceQueryDto,
  ) {
    return this.query.getRepositoryStatus(repositoryId);
  }

  @Get('job/:jobId')
  @RequireEmbeddingWorkspace(WorkspacePermission.READ_WORKSPACE)
  @ApiOperation({ summary: 'Inspect an embedding queue job' })
  @ApiParam({ name: 'jobId' })
  @ApiQuery({ name: 'workspaceId', required: true })
  job(
    @Param('jobId') jobId: string,
    @Query() _query: EmbeddingWorkspaceQueryDto,
  ) {
    return this.query.getJob(jobId);
  }

  @Post('retry/:jobId')
  @RequireEmbeddingWorkspace(WorkspacePermission.CREATE_REPOSITORIES)
  @ApiOperation({ summary: 'Retry a failed embedding job' })
  @ApiParam({ name: 'jobId' })
  @ApiBody({ type: EmbeddingWorkspaceQueryDto })
  async retry(
    @Param('jobId') jobId: string,
    @Body() _body: EmbeddingWorkspaceQueryDto,
  ) {
    const job = await this.queue.retryJob(jobId);
    if (!job) {
      return this.query.getJob(jobId);
    }
    return {
      id: job.id,
      retried: true,
    };
  }

  @Get('providers')
  @RequireEmbeddingWorkspace(WorkspacePermission.READ_WORKSPACE)
  @ApiOperation({ summary: 'List embedding providers and health' })
  @ApiQuery({ name: 'workspaceId', required: true })
  providers(@Query() _query: EmbeddingWorkspaceQueryDto) {
    return this.query.providersStatus();
  }

  @Get('statistics')
  @RequireEmbeddingWorkspace(WorkspacePermission.READ_WORKSPACE)
  @ApiOperation({ summary: 'Embedding pipeline statistics' })
  statistics(@Query() query: EmbeddingStatisticsQueryDto) {
    return this.query.getStatistics(query.workspaceId);
  }
}
