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
import { CurrentDeveloper } from '../../identity/decorators/current-developer.decorator';
import type { AuthenticatedDeveloper } from '../../identity/entities/authenticated-developer.entity';
import { GithubWorkspaceGuard } from '../../github/guards/github-workspace.guard';
import { WorkspacePermission } from '../../workspaces/constants/workspace-permissions.constants';
import { RequireWorkspacePermission } from '../../workspaces/decorators/require-workspace-permission.decorator';
import {
  AiDigestsQueryDto,
  AiProviderTestDto,
  AiStatusQueryDto,
  StartAiExtractionDto,
} from '../dto/ai-knowledge.dto';
import { AiKnowledgeOrchestrationService } from '../services/ai-knowledge-orchestration.service';
import { AiKnowledgeQueryService } from '../services/ai-knowledge-query.service';
import { HybridAiOrchestrationService } from '../services/hybrid-ai-orchestration.service';

function RequireAiWorkspace(...permissions: WorkspacePermission[]) {
  return applyDecorators(
    UseGuards(GithubWorkspaceGuard),
    RequireWorkspacePermission(...permissions),
  );
}

@ApiTags('ai')
@ApiBearerAuth('JWT')
@Controller({ path: 'ai', version: '1' })
export class AiKnowledgeController {
  constructor(
    private readonly orchestration: AiKnowledgeOrchestrationService,
    private readonly queryService: AiKnowledgeQueryService,
    private readonly hybrid: HybridAiOrchestrationService,
  ) {}

  @Post('extract')
  @RequireAiWorkspace(WorkspacePermission.CREATE_REPOSITORIES)
  @ApiOperation({
    summary:
      'Enqueue AI extraction for all repositories (hybrid digest pipeline by default)',
  })
  @ApiBody({ type: StartAiExtractionDto })
  extractWorkspace(
    @Body() body: StartAiExtractionDto,
    @CurrentDeveloper() _developer: AuthenticatedDeveloper,
  ) {
    const useHybrid = body.hybrid !== false;
    if (useHybrid) {
      return this.hybrid.enqueueWorkspace(body.workspaceId, {
        mode: body.mode ?? body.scope ?? 'light',
        provider: body.provider,
        force: body.force,
        sync: body.sync,
      });
    }
    return this.orchestration.enqueueWorkspace(body.workspaceId, {
      provider: body.provider,
      force: body.force,
      scope: body.scope ?? 'light',
    });
  }

  @Post('repository/:id')
  @RequireAiWorkspace(WorkspacePermission.CREATE_REPOSITORIES)
  @ApiOperation({ summary: 'Enqueue AI extraction for one repository' })
  @ApiParam({ name: 'id', description: 'Repository UUID' })
  @ApiBody({ type: StartAiExtractionDto })
  extractRepository(
    @Param('id', ParseUUIDPipe) repositoryId: string,
    @Body() body: StartAiExtractionDto,
  ) {
    const useHybrid = body.hybrid !== false;
    if (useHybrid) {
      return this.hybrid.enqueueRepository(repositoryId, body.workspaceId, {
        mode: body.mode ?? body.scope ?? 'light',
        provider: body.provider,
        force: body.force,
        sync: body.sync,
      });
    }
    return this.orchestration.enqueueRepository(
      repositoryId,
      body.workspaceId,
      {
        provider: body.provider,
        force: body.force,
        scope: body.scope ?? 'light',
      },
    );
  }

  @Get('status')
  @RequireAiWorkspace(WorkspacePermission.READ_WORKSPACE)
  @ApiOperation({ summary: 'AI extraction status by workspace' })
  @ApiQuery({ name: 'workspaceId', required: true })
  getStatus(@Query() query: AiStatusQueryDto) {
    return this.queryService.getStatus(query.workspaceId);
  }

  @Get('statistics')
  @RequireAiWorkspace(WorkspacePermission.READ_WORKSPACE)
  @ApiOperation({ summary: 'AI extraction statistics' })
  @ApiQuery({ name: 'workspaceId', required: true })
  getStatistics(@Query() query: AiStatusQueryDto) {
    return this.queryService.getStatistics(query.workspaceId);
  }

  @Get('jobs')
  @RequireAiWorkspace(WorkspacePermission.READ_WORKSPACE)
  @ApiOperation({ summary: 'AI extraction queue/job counts (legacy + hybrid)' })
  @ApiQuery({ name: 'workspaceId', required: true })
  async getJobs(@Query() query: AiStatusQueryDto) {
    const [legacy, hybrid] = await Promise.all([
      this.queryService.getJobs(),
      this.hybrid.getHybridJobs(),
    ]);
    return {
      workspaceId: query.workspaceId,
      legacy,
      hybrid,
    };
  }

  @Get('providers')
  @RequireAiWorkspace(WorkspacePermission.READ_WORKSPACE)
  @ApiOperation({ summary: 'List configured AI providers and enablement' })
  @ApiQuery({ name: 'workspaceId', required: true })
  getProviders(@Query() query: AiStatusQueryDto) {
    return this.hybrid.listProviders().then((providers) => ({
      workspaceId: query.workspaceId,
      providers,
    }));
  }

  @Get('providers/status')
  @RequireAiWorkspace(WorkspacePermission.READ_WORKSPACE)
  @ApiOperation({ summary: 'Provider readiness + hybrid monitoring snapshot' })
  @ApiQuery({ name: 'workspaceId', required: true })
  async getProvidersStatus(@Query() query: AiStatusQueryDto) {
    const [providers, monitoring] = await Promise.all([
      this.hybrid.providersStatus(),
      this.hybrid.getHybridMonitoring(query.workspaceId),
    ]);
    return { providers, monitoring };
  }

  @Get('digests')
  @RequireAiWorkspace(WorkspacePermission.READ_WORKSPACE)
  @ApiOperation({ summary: 'List compressed repository digests' })
  @ApiQuery({ name: 'workspaceId', required: true })
  @ApiQuery({ name: 'repositoryId', required: false })
  getDigests(@Query() query: AiDigestsQueryDto) {
    return this.hybrid.listDigests(query.workspaceId, query.repositoryId);
  }

  @Post('provider/test')
  @RequireAiWorkspace(WorkspacePermission.CREATE_REPOSITORIES)
  @ApiOperation({ summary: 'Smoke-test a single AI provider' })
  @ApiBody({ type: AiProviderTestDto })
  testProvider(@Body() body: AiProviderTestDto) {
    return this.hybrid.testProvider(body.provider);
  }
}
