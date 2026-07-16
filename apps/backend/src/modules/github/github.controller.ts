import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Query,
  Req,
  Res,
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
import type { Request, Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { SkipTransform } from '../../common/decorators/skip-transform.decorator';
import { CurrentDeveloper } from '../identity/decorators/current-developer.decorator';
import type { AuthenticatedDeveloper } from '../identity/entities/authenticated-developer.entity';
import { WorkspacePermission } from '../workspaces/constants/workspace-permissions.constants';
import { RequireWorkspacePermission } from '../workspaces/decorators/require-workspace-permission.decorator';
import {
  ConnectedAccountResponseDto,
  GithubCallbackQueryDto,
  GithubConnectQueryDto,
  GithubConnectResponseDto,
  GithubMessageResponseDto,
  GithubWorkspaceDisconnectQueryDto,
  GithubWorkspaceQueryDto,
  UserGithubAccountResponseDto,
} from './dto';
import { GithubWorkspaceGuard } from './guards/github-workspace.guard';
import { GithubService } from './github.service';

function RequireGithubWorkspace(...permissions: WorkspacePermission[]) {
  return applyDecorators(
    UseGuards(GithubWorkspaceGuard),
    RequireWorkspacePermission(...permissions),
  );
}

@ApiTags('github')
@Controller({ path: 'github', version: '1' })
export class GithubController {
  constructor(private readonly githubService: GithubService) {}

  @Get('connect')
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Connect a GitHub account (user-level)',
    description:
      'Primary flow: connect GitHub after login without a workspace. Optionally pass `workspaceId` to link immediately. Set `returnUrl=true` for Swagger.',
  })
  @ApiQuery({ name: 'workspaceId', required: false, type: String })
  @ApiQuery({ name: 'returnUrl', required: false, type: Boolean })
  @ApiResponse({ status: 302, description: 'Redirect to GitHub authorization' })
  @ApiResponse({ status: 200, type: GithubConnectResponseDto })
  async connect(
    @CurrentDeveloper() user: AuthenticatedDeveloper,
    @Query() query: GithubConnectQueryDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<GithubConnectResponseDto | void> {
    const authorizationUrl = await this.githubService.initiateConnect(
      user.id,
      query.workspaceId,
      this.extractRequestContext(req),
    );

    if (query.returnUrl) {
      return { authorizationUrl };
    }

    res.redirect(HttpStatus.FOUND, authorizationUrl);
  }

  @Public()
  @Get('callback')
  @SkipTransform()
  @ApiOperation({ summary: 'GitHub OAuth callback' })
  @ApiResponse({ status: 302, description: 'Redirect to frontend' })
  async callback(
    @Query() query: GithubCallbackQueryDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.githubService.handleCallback(
      query.error ? undefined : query.code,
      query.state,
      this.extractRequestContext(req),
      query.error,
      query.error_description,
    );

    res.redirect(HttpStatus.FOUND, result.redirectUrl);
  }

  @Get('accounts')
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'List GitHub accounts connected by the authenticated user',
    description:
      'Use the returned `id` as `githubTokenId` when creating a workspace.',
  })
  @ApiResponse({ status: 200, type: [UserGithubAccountResponseDto] })
  listUserAccounts(@CurrentDeveloper() user: AuthenticatedDeveloper) {
    return this.githubService.listUserGithubAccounts(user.id);
  }

  @Delete('accounts/:oauthTokenId')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Remove a GitHub account from the user profile',
    description:
      'Unlinks all workspaces and deletes the encrypted OAuth token.',
  })
  @ApiParam({ name: 'oauthTokenId', type: String })
  @ApiResponse({ status: 200, type: GithubMessageResponseDto })
  removeUserAccount(
    @CurrentDeveloper() user: AuthenticatedDeveloper,
    @Param('oauthTokenId', ParseUUIDPipe) oauthTokenId: string,
    @Req() req: Request,
  ) {
    return this.githubService.disconnectUserGithubAccount(
      user.id,
      oauthTokenId,
      this.extractRequestContext(req),
    );
  }

  @Get('account')
  @ApiBearerAuth('JWT')
  @RequireGithubWorkspace(WorkspacePermission.READ_WORKSPACE)
  @ApiOperation({ summary: 'List GitHub accounts linked to a workspace' })
  @ApiQuery({ name: 'workspaceId', required: true, type: String })
  @ApiResponse({ status: 200, type: [ConnectedAccountResponseDto] })
  listWorkspaceAccounts(
    @CurrentDeveloper() user: AuthenticatedDeveloper,
    @Query() query: GithubWorkspaceQueryDto,
  ) {
    return this.githubService.listWorkspaceAccounts(user.id, query.workspaceId);
  }

  @Delete('disconnect')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT')
  @RequireGithubWorkspace(WorkspacePermission.CREATE_REPOSITORIES)
  @ApiOperation({ summary: 'Unlink a GitHub account from a workspace only' })
  @ApiQuery({ name: 'workspaceId', required: true, type: String })
  @ApiQuery({ name: 'accountId', required: true, type: String })
  @ApiResponse({ status: 200, type: GithubMessageResponseDto })
  disconnectFromWorkspace(
    @CurrentDeveloper() user: AuthenticatedDeveloper,
    @Query() query: GithubWorkspaceDisconnectQueryDto,
    @Req() req: Request,
  ) {
    return this.githubService.disconnectWorkspaceAccount(
      user.id,
      query.workspaceId,
      query.accountId,
      this.extractRequestContext(req),
    );
  }

  private extractRequestContext(req: Request) {
    return {
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    };
  }
}
