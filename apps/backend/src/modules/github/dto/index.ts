import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConnectedAccountStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class GithubConnectQueryDto {
  @ApiPropertyOptional({
    description:
      'Optional workspace to link immediately after OAuth. Omit to connect at user level first.',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  workspaceId?: string;

  @ApiPropertyOptional({
    description:
      'When true, returns the GitHub authorization URL as JSON instead of a 302 redirect. Use this in Swagger.',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  returnUrl?: boolean;
}

export class GithubWorkspaceQueryDto {
  @ApiProperty({
    description: 'Workspace to inspect GitHub accounts for',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  workspaceId!: string;
}

export class GithubWorkspaceDisconnectQueryDto extends GithubWorkspaceQueryDto {
  @ApiProperty({
    description: 'Connected account ID to unlink from the workspace',
    example: '660e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  accountId!: string;
}

export class GithubCallbackQueryDto {
  @ApiPropertyOptional({
    description: 'Authorization code returned by GitHub',
  })
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({
    description: 'Signed OAuth state parameter for CSRF protection',
  })
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({
    description: 'Error code when GitHub denies authorization',
  })
  @IsOptional()
  error?: string;

  @ApiPropertyOptional({
    description: 'Human-readable error description from GitHub',
  })
  @IsOptional()
  error_description?: string;
}

export class ConnectedAccountResponseDto {
  @ApiProperty({ example: '660e8400-e29b-41d4-a716-446655440001' })
  id!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  workspaceId!: string;

  @ApiProperty({ example: 'GITHUB' })
  provider!: 'GITHUB';

  @ApiProperty({ example: '12345678' })
  providerAccountId!: string;

  @ApiProperty({ example: 'octocat' })
  providerUsername!: string;

  @ApiPropertyOptional({ example: 'The Octocat' })
  displayName!: string | null;

  @ApiPropertyOptional({
    example: 'https://avatars.githubusercontent.com/u/1?v=4',
  })
  avatarUrl!: string | null;

  @ApiPropertyOptional({ example: 'octocat@github.com' })
  email!: string | null;

  @ApiPropertyOptional({ example: 'https://github.com/octocat' })
  profileUrl!: string | null;

  @ApiProperty({
    enum: ConnectedAccountStatus,
    example: ConnectedAccountStatus.ACTIVE,
  })
  status!: ConnectedAccountStatus;

  @ApiProperty()
  connectedAt!: Date;

  @ApiPropertyOptional()
  disconnectedAt!: Date | null;

  @ApiPropertyOptional()
  lastUsedAt!: Date | null;
}

export class UserGithubWorkspaceLinkDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  connectedAccountId!: string;

  @ApiProperty()
  status!: string;
}

export class UserGithubAccountResponseDto {
  @ApiProperty({
    description:
      'OAuth token ID — use as githubTokenId when creating a workspace',
  })
  id!: string;

  @ApiProperty({ example: 'GITHUB' })
  provider!: 'GITHUB';

  @ApiProperty()
  providerAccountId!: string;

  @ApiProperty({ example: 'octocat' })
  providerUsername!: string;

  @ApiPropertyOptional()
  displayName!: string | null;

  @ApiPropertyOptional()
  avatarUrl!: string | null;

  @ApiPropertyOptional()
  email!: string | null;

  @ApiPropertyOptional()
  profileUrl!: string | null;

  @ApiProperty()
  connectedAt!: Date;

  @ApiPropertyOptional()
  lastUsedAt!: Date | null;

  @ApiProperty({ type: [UserGithubWorkspaceLinkDto] })
  workspaces!: UserGithubWorkspaceLinkDto[];
}

export class GithubMessageResponseDto {
  @ApiProperty({ example: 'GitHub account removed successfully' })
  message!: string;
}

export class GithubConnectResponseDto {
  @ApiProperty({
    example: 'https://github.com/login/oauth/authorize?client_id=...&state=...',
  })
  authorizationUrl!: string;
}
