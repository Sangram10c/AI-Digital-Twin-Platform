// ============================================================
// Chat Module — Request / Query DTOs
// ============================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CHAT_DEFAULTS } from '../constants/chat.constants';

export class ChatRequestDto {
  @ApiProperty({
    description:
      'The user question or instruction to answer using the knowledge base.',
    example: 'Which commit introduced JWT refresh token rotation?',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  query!: string;

  @ApiProperty({
    description: 'Workspace UUID to scope the search and conversation.',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  workspaceId!: string;

  @ApiPropertyOptional({
    description:
      'Resume an existing conversation (multi-turn). Omit to start a new one.',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID()
  conversationId?: string;

  @ApiPropertyOptional({
    description:
      'Scope search to specific repository IDs. Searches all workspace repos if omitted.',
    type: [String],
    example: ['550e8400-e29b-41d4-a716-446655440002'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  repositoryIds?: string[];

  @ApiPropertyOptional({
    description:
      'AI provider override. Defaults to the workspace configured provider.',
    example: 'groq',
    enum: [
      'groq',
      'openrouter',
      'huggingface',
      'cloudflare',
      'gemini',
      'openai',
      'anthropic',
      'ollama',
    ],
  })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({
    description: 'Number of knowledge chunks to retrieve. Defaults to 10.',
    example: 10,
    default: CHAT_DEFAULTS.topK,
    minimum: 1,
    maximum: 25,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(25)
  @Type(() => Number)
  topK?: number;

  @ApiPropertyOptional({
    description:
      'Temperature for AI generation (0.0 = deterministic, 1.0 = creative).',
    example: 0.2,
    minimum: 0,
    maximum: 1,
  })
  @IsOptional()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  temperature?: number;
}

// ────────────────────────────────────────────────────────────

export class ChatStreamRequestDto extends ChatRequestDto {
  @ApiProperty({
    description: 'Set to true to receive a Server-Sent Events stream.',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  stream?: boolean = true;
}

// ────────────────────────────────────────────────────────────

export class ChatQueryStreamDto {
  @ApiProperty({
    description:
      'The user question or instruction to answer using the knowledge base.',
    example: 'Explain how AST chunking works in this repository',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  query!: string;

  @ApiProperty({
    description: 'Workspace UUID to scope the search and conversation.',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  workspaceId!: string;

  @ApiPropertyOptional({
    description:
      'Resume an existing conversation (multi-turn). Omit to start a new one.',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID()
  conversationId?: string;

  @ApiPropertyOptional({
    description: 'AI provider override.',
    example: 'groq',
    enum: [
      'groq',
      'openrouter',
      'huggingface',
      'cloudflare',
      'gemini',
      'openai',
      'anthropic',
      'ollama',
    ],
  })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({
    description: 'Number of knowledge chunks to retrieve. Defaults to 10.',
    example: 10,
    default: CHAT_DEFAULTS.topK,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(25)
  @Type(() => Number)
  topK?: number;

  @ApiPropertyOptional({
    description:
      'Temperature for AI generation (0.0 = deterministic, 1.0 = creative).',
    example: 0.2,
  })
  @IsOptional()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  temperature?: number;
}

// ────────────────────────────────────────────────────────────

export class UpdateConversationDto {
  @ApiProperty({
    description: 'New title for the conversation.',
    example: 'JWT Refresh Token Investigation',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(CHAT_DEFAULTS.maxTitleLength)
  title!: string;
}

// ────────────────────────────────────────────────────────────

export class ConversationListQueryDto {
  @ApiProperty({
    description: 'Workspace UUID to list conversations for.',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  workspaceId!: string;

  @ApiPropertyOptional({
    description: 'Page number (1-based).',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page.',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;
}
