import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsUUID } from 'class-validator';

const PROVIDERS = [
  'groq',
  'gemini',
  'openai',
  'voyage',
  'nomic',
  'local',
  'mock',
] as const;

export class GenerateEmbeddingsDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  workspaceId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  repositoryId?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  force?: boolean;

  @ApiPropertyOptional({ enum: PROVIDERS })
  @IsOptional()
  @IsIn([...PROVIDERS])
  provider?: (typeof PROVIDERS)[number];
}

export class EmbeddingWorkspaceQueryDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  workspaceId!: string;
}

export class EmbeddingStatisticsQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  workspaceId?: string;
}
