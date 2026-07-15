import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkspaceMemberRole, WorkspaceStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IsWorkspaceSlug } from '../validators/is-workspace-slug.validator';

export class CreateWorkspaceDto {
  @ApiProperty({ example: 'Acme Engineering' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional({
    example: 'acme-engineering',
    description: 'Auto-generated from name when omitted',
  })
  @IsOptional()
  @IsString()
  @IsWorkspaceSlug()
  slug?: string;

  @ApiPropertyOptional({ example: 'Primary engineering workspace' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

export class UpdateWorkspaceDto {
  @ApiPropertyOptional({ example: 'Acme Engineering' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ enum: WorkspaceStatus })
  @IsOptional()
  @IsEnum(WorkspaceStatus)
  status?: WorkspaceStatus;
}

export class InviteMemberDto {
  @ApiProperty({ example: 'developer@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({
    enum: WorkspaceMemberRole,
    example: WorkspaceMemberRole.MEMBER,
    description: 'MEMBER maps to developer-level access in the schema',
  })
  @IsEnum(WorkspaceMemberRole)
  role!: WorkspaceMemberRole;
}

export class UpdateMemberRoleDto {
  @ApiProperty({
    enum: WorkspaceMemberRole,
    example: WorkspaceMemberRole.ADMIN,
  })
  @IsEnum(WorkspaceMemberRole)
  role!: WorkspaceMemberRole;
}

export class RemoveMemberDto {
  @ApiPropertyOptional({ description: 'Optional reason for audit trails' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class WorkspacePreferencesDto {
  @ApiPropertyOptional({ example: 'main' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  defaultBranch?: string;

  @ApiPropertyOptional({
    example: 'private',
    enum: ['private', 'internal', 'public'],
  })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  visibility?: string;

  @ApiPropertyOptional({ example: 'UTC' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;

  @ApiPropertyOptional({ example: 'en' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  language?: string;
}

export class UpdateWorkspaceSettingsDto {
  @ApiPropertyOptional({ example: 'openai' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  defaultAiProvider?: string;

  @ApiPropertyOptional({ example: 'gpt-4o' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  defaultAiModel?: string;

  @ApiPropertyOptional({ example: 'text-embedding-3-small' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  defaultEmbeddingModel?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  autoSyncEnabled?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  notificationsEnabled?: boolean;

  @ApiPropertyOptional({ type: WorkspacePreferencesDto })
  @IsOptional()
  @IsObject()
  @Type(() => WorkspacePreferencesDto)
  preferences?: WorkspacePreferencesDto;
}

export class TransferOwnershipDto {
  @ApiProperty({ description: 'User ID of the new workspace owner' })
  @IsUUID()
  newOwnerId!: string;
}

export class WorkspaceMemberResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  email!: string;

  @ApiPropertyOptional()
  displayName!: string | null;

  @ApiProperty({ enum: WorkspaceMemberRole })
  role!: WorkspaceMemberRole;

  @ApiProperty()
  joinedAt!: Date;
}

export class WorkspaceSettingsResponseDto {
  @ApiPropertyOptional()
  defaultAiProvider!: string | null;

  @ApiPropertyOptional()
  defaultAiModel!: string | null;

  @ApiPropertyOptional()
  defaultEmbeddingModel!: string | null;

  @ApiProperty()
  autoSyncEnabled!: boolean;

  @ApiProperty()
  notificationsEnabled!: boolean;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  preferences!: Record<string, unknown> | null;
}

export class WorkspaceResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiPropertyOptional()
  description!: string | null;

  @ApiProperty()
  ownerId!: string;

  @ApiProperty({ enum: WorkspaceStatus })
  status!: WorkspaceStatus;

  @ApiPropertyOptional({ type: WorkspaceSettingsResponseDto })
  settings?: WorkspaceSettingsResponseDto;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class MessageResponseDto {
  @ApiProperty()
  message!: string;
}
