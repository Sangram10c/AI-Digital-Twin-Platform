import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  applyDecorators,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentDeveloper } from '../identity/decorators/current-developer.decorator';
import type { AuthenticatedDeveloper } from '../identity/entities/authenticated-developer.entity';
import { GithubWorkspaceGuard } from '../github/guards/github-workspace.guard';
import { WorkspacePermission } from '../workspaces/constants/workspace-permissions.constants';
import { RequireWorkspacePermission } from '../workspaces/decorators/require-workspace-permission.decorator';
import { SearchRequestDto, SearchWorkspaceQueryDto } from './dto/search.dto';
import { SearchService } from './search.service';

function RequireSearchWorkspace(...permissions: WorkspacePermission[]) {
  return applyDecorators(
    UseGuards(GithubWorkspaceGuard),
    RequireWorkspacePermission(...permissions),
  );
}

@ApiTags('search')
@ApiBearerAuth('JWT')
@Controller({ path: 'search', version: '1' })
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post()
  @RequireSearchWorkspace(WorkspacePermission.READ_WORKSPACE)
  @ApiOperation({
    summary: 'Hybrid search (vector + keyword) — primary RAG retrieval API',
  })
  @ApiBody({ type: SearchRequestDto })
  search(
    @CurrentDeveloper() user: AuthenticatedDeveloper,
    @Body() body: SearchRequestDto,
  ) {
    return this.searchService.search(user.id, body);
  }

  @Post('hybrid')
  @RequireSearchWorkspace(WorkspacePermission.READ_WORKSPACE)
  @ApiOperation({ summary: 'Explicit hybrid search' })
  @ApiBody({ type: SearchRequestDto })
  hybrid(
    @CurrentDeveloper() user: AuthenticatedDeveloper,
    @Body() body: SearchRequestDto,
  ) {
    return this.searchService.hybrid(user.id, body);
  }

  @Post('vector')
  @RequireSearchWorkspace(WorkspacePermission.READ_WORKSPACE)
  @ApiOperation({
    summary: 'Semantic vector search only (pgvector cosine similarity)',
  })
  @ApiBody({ type: SearchRequestDto })
  vector(
    @CurrentDeveloper() user: AuthenticatedDeveloper,
    @Body() body: SearchRequestDto,
  ) {
    return this.searchService.vector(user.id, body);
  }

  @Post('keyword')
  @RequireSearchWorkspace(WorkspacePermission.READ_WORKSPACE)
  @ApiOperation({
    summary: 'PostgreSQL full-text keyword search only (no embeddings)',
  })
  @ApiBody({ type: SearchRequestDto })
  keyword(
    @CurrentDeveloper() user: AuthenticatedDeveloper,
    @Body() body: SearchRequestDto,
  ) {
    return this.searchService.keyword(user.id, body);
  }

  @Get('history')
  @RequireSearchWorkspace(WorkspacePermission.READ_WORKSPACE)
  @ApiOperation({ summary: 'Recent search history for the current user' })
  @ApiQuery({ name: 'workspaceId', required: true })
  @ApiQuery({ name: 'limit', required: false })
  history(
    @CurrentDeveloper() user: AuthenticatedDeveloper,
    @Query() query: SearchWorkspaceQueryDto,
  ) {
    return this.searchService.history(
      query.workspaceId,
      user.id,
      query.limit ?? 20,
    );
  }

  @Get('statistics')
  @RequireSearchWorkspace(WorkspacePermission.READ_WORKSPACE)
  @ApiOperation({ summary: 'Search analytics for a workspace' })
  @ApiQuery({ name: 'workspaceId', required: true })
  statistics(@Query() query: SearchWorkspaceQueryDto) {
    return this.searchService.statistics(query.workspaceId);
  }

  @Get('popular')
  @RequireSearchWorkspace(WorkspacePermission.READ_WORKSPACE)
  @ApiOperation({ summary: 'Most popular search queries in a workspace' })
  @ApiQuery({ name: 'workspaceId', required: true })
  @ApiQuery({ name: 'limit', required: false })
  popular(@Query() query: SearchWorkspaceQueryDto) {
    return this.searchService.popular(query.workspaceId, query.limit ?? 20);
  }
}
