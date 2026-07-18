import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { KnowledgeProcessingStatus } from '../interfaces/knowledge.interfaces';

export class ProcessKnowledgeDto {
  @ApiProperty({
    format: 'uuid',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID()
  workspaceId!: string;

  @ApiPropertyOptional({
    description: 'Reprocess even when checksum matches',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}

export class ProcessRepositoryKnowledgeDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  workspaceId!: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}

export class ListKnowledgeDocumentsQueryDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  workspaceId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  repositoryId?: string;

  @ApiPropertyOptional({ example: 'COMMIT' })
  @IsOptional()
  @IsString()
  sourceType?: string;

  @ApiPropertyOptional({ enum: KnowledgeProcessingStatus })
  @IsOptional()
  @IsEnum(KnowledgeProcessingStatus)
  status?: KnowledgeProcessingStatus;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 25, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class ListKnowledgeChunksQueryDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  workspaceId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  repositoryId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Knowledge source or documentation id',
  })
  @IsOptional()
  @IsUUID()
  documentId?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 25, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class KnowledgeStatisticsQueryDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  workspaceId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  repositoryId?: string;
}

export class KnowledgeProcessResponseDto {
  @ApiProperty({ example: true })
  accepted!: boolean;

  @ApiProperty({ example: 'Knowledge processing jobs enqueued' })
  message!: string;

  @ApiPropertyOptional()
  repositoriesEnqueued?: number;
}

export class KnowledgeDocumentSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'source' })
  documentKind!: string;

  @ApiPropertyOptional({ example: 'COMMIT' })
  sourceType?: string;

  @ApiProperty({ example: 'Commit abc1234: Fix webhook parsing' })
  title?: string;

  @ApiPropertyOptional({ enum: KnowledgeProcessingStatus })
  processingStatus?: KnowledgeProcessingStatus;
}

export class KnowledgeChunkSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 0 })
  chunkIndex!: number;

  @ApiPropertyOptional({ example: 128 })
  tokenCount?: number;

  @ApiPropertyOptional()
  contentPreview?: string;
}
