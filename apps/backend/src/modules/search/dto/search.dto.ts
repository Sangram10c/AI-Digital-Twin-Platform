import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { KnowledgeSourceType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { SEARCH_TOP_K_OPTIONS } from '../constants/search.constants';

export class SearchFiltersDto {
  @ApiPropertyOptional({ type: [String], format: 'uuid' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  repositoryIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  branch?: string;

  @ApiPropertyOptional({ description: 'Programming language filter' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  language?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(128)
  framework?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(256)
  module?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  directory?: string;

  @ApiPropertyOptional({ example: 'ts' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  fileExtension?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  documentType?: string;

  @ApiPropertyOptional({ enum: KnowledgeSourceType })
  @IsOptional()
  @IsEnum(KnowledgeSourceType)
  knowledgeSourceType?: KnowledgeSourceType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  commitSha?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  pullRequestId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  issueId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(128)
  tag?: string;

  @ApiPropertyOptional({ description: 'ISO date' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'ISO date' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}

export class SearchRequestDto extends SearchFiltersDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  workspaceId!: string;

  @ApiProperty({
    minLength: 1,
    maxLength: 1024,
    example: 'How does JWT authentication work?',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(1024)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  query!: string;

  @ApiPropertyOptional({
    enum: SEARCH_TOP_K_OPTIONS,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsIn([...SEARCH_TOP_K_OPTIONS])
  topK?: (typeof SEARCH_TOP_K_OPTIONS)[number];

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  skipCache?: boolean;
}

export class SearchWorkspaceQueryDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  workspaceId!: string;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
