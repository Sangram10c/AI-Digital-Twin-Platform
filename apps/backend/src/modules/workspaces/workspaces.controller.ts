import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentDeveloper } from '../identity/decorators/current-developer.decorator';
import type { AuthenticatedDeveloper } from '../identity/entities/authenticated-developer.entity';
import { WorkspacePermission } from './constants/workspace-permissions.constants';
import { RequireWorkspacePermission } from './decorators/require-workspace-permission.decorator';
import {
  CreateWorkspaceDto,
  InviteMemberDto,
  MessageResponseDto,
  TransferOwnershipDto,
  UpdateMemberRoleDto,
  UpdateWorkspaceDto,
  UpdateWorkspaceSettingsDto,
  WorkspaceMemberResponseDto,
  WorkspaceResponseDto,
  WorkspaceSettingsResponseDto,
} from './dto';
import { WorkspaceMemberGuard } from './guards/workspace-member.guard';
import { WorkspacesService } from './workspaces.service';

@ApiTags('workspaces')
@ApiBearerAuth('JWT')
@Controller({ path: 'workspaces', version: '1' })
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new workspace' })
  @ApiResponse({ status: 201, type: WorkspaceResponseDto })
  create(
    @CurrentDeveloper() user: AuthenticatedDeveloper,
    @Body() dto: CreateWorkspaceDto,
  ) {
    return this.workspacesService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List workspaces for the authenticated user' })
  @ApiResponse({ status: 200, type: [WorkspaceResponseDto] })
  findAll(@CurrentDeveloper() user: AuthenticatedDeveloper) {
    return this.workspacesService.findAllForUser(user.id);
  }

  @Get(':id')
  @UseGuards(WorkspaceMemberGuard)
  @RequireWorkspacePermission(WorkspacePermission.READ_WORKSPACE)
  @ApiOperation({ summary: 'Get workspace by ID' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  @ApiResponse({ status: 200, type: WorkspaceResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentDeveloper() user: AuthenticatedDeveloper,
  ) {
    return this.workspacesService.findOne(id, user.id);
  }

  @Patch(':id')
  @UseGuards(WorkspaceMemberGuard)
  @RequireWorkspacePermission(WorkspacePermission.UPDATE_WORKSPACE)
  @ApiOperation({ summary: 'Update workspace details' })
  @ApiResponse({ status: 200, type: WorkspaceResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentDeveloper() user: AuthenticatedDeveloper,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    return this.workspacesService.update(id, user.id, dto);
  }

  @Delete(':id')
  @UseGuards(WorkspaceMemberGuard)
  @RequireWorkspacePermission(WorkspacePermission.DELETE_WORKSPACE)
  @ApiOperation({ summary: 'Delete workspace (owner only)' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentDeveloper() user: AuthenticatedDeveloper,
  ) {
    return this.workspacesService.remove(id, user.id);
  }

  @Post(':id/invite')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(WorkspaceMemberGuard)
  @RequireWorkspacePermission(WorkspacePermission.INVITE_MEMBERS)
  @ApiOperation({ summary: 'Invite a user to the workspace' })
  @ApiResponse({ status: 201, type: WorkspaceMemberResponseDto })
  invite(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentDeveloper() user: AuthenticatedDeveloper,
    @Body() dto: InviteMemberDto,
  ) {
    return this.workspacesService.inviteMember(id, user.id, dto);
  }

  @Get(':id/members')
  @UseGuards(WorkspaceMemberGuard)
  @RequireWorkspacePermission(WorkspacePermission.READ_WORKSPACE)
  @ApiOperation({ summary: 'List workspace members' })
  @ApiResponse({ status: 200, type: [WorkspaceMemberResponseDto] })
  listMembers(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentDeveloper() user: AuthenticatedDeveloper,
  ) {
    return this.workspacesService.listMembers(id, user.id);
  }

  @Patch(':id/members/:memberId')
  @UseGuards(WorkspaceMemberGuard)
  @RequireWorkspacePermission(WorkspacePermission.MANAGE_MEMBERS)
  @ApiOperation({ summary: 'Update a workspace member role' })
  @ApiResponse({ status: 200, type: WorkspaceMemberResponseDto })
  updateMemberRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @CurrentDeveloper() user: AuthenticatedDeveloper,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.workspacesService.updateMemberRole(id, memberId, user.id, dto);
  }

  @Delete(':id/members/:memberId')
  @UseGuards(WorkspaceMemberGuard)
  @RequireWorkspacePermission(WorkspacePermission.MANAGE_MEMBERS)
  @ApiOperation({ summary: 'Remove a workspace member' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  removeMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @CurrentDeveloper() user: AuthenticatedDeveloper,
  ) {
    return this.workspacesService.removeMember(id, memberId, user.id);
  }

  @Patch(':id/settings')
  @UseGuards(WorkspaceMemberGuard)
  @RequireWorkspacePermission(WorkspacePermission.UPDATE_SETTINGS)
  @ApiOperation({ summary: 'Update workspace settings' })
  @ApiResponse({ status: 200, type: WorkspaceSettingsResponseDto })
  updateSettings(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentDeveloper() user: AuthenticatedDeveloper,
    @Body() dto: UpdateWorkspaceSettingsDto,
  ) {
    return this.workspacesService.updateSettings(id, user.id, dto);
  }

  @Post(':id/transfer-owner')
  @UseGuards(WorkspaceMemberGuard)
  @RequireWorkspacePermission(WorkspacePermission.TRANSFER_OWNERSHIP)
  @ApiOperation({ summary: 'Transfer workspace ownership' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  transferOwnership(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentDeveloper() user: AuthenticatedDeveloper,
    @Body() dto: TransferOwnershipDto,
  ) {
    return this.workspacesService.transferOwnership(id, user.id, dto);
  }
}
