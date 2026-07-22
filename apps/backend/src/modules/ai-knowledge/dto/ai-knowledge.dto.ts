import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsUUID, IsString } from 'class-validator';
import type {
  AiExtractionScope,
  SupportedAiProvider,
} from '../interfaces/ai-knowledge.interfaces';

export class StartAiExtractionDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  workspaceId!: string;

  @ApiPropertyOptional({
    enum: [
      'groq',
      'openrouter',
      'huggingface',
      'cloudflare',
      'openai',
      'anthropic',
      'gemini',
      'ollama',
    ],
  })
  @IsOptional()
  @IsIn([
    'groq',
    'openrouter',
    'huggingface',
    'cloudflare',
    'openai',
    'anthropic',
    'gemini',
    'ollama',
  ])
  provider?: SupportedAiProvider;

  @ApiPropertyOptional({
    enum: ['light', 'recent', 'full'],
    default: 'light',
    description:
      'Legacy scope (kept for backward compatibility). Prefer `mode` for the hybrid pipeline.',
  })
  @IsOptional()
  @IsIn(['light', 'recent', 'full'])
  scope?: AiExtractionScope;

  @ApiPropertyOptional({
    enum: ['heuristics', 'heuristics_only', 'light', 'full'],
    default: 'light',
    description:
      'Hybrid AI mode. heuristics_only = no LLM. light = digests (repo/docs/releases/PR batches). full = all digests including modules.',
  })
  @IsOptional()
  @IsIn([
    'heuristics',
    'heuristics_only',
    'light',
    'full',
    'HEURISTICS_ONLY',
    'LIGHT',
    'FULL',
  ])
  mode?: string;

  @ApiPropertyOptional({
    default: true,
    description:
      'When true (default), uses the hybrid digest pipeline. Set false to use the legacy per-source AI queues.',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hybrid?: boolean;

  @ApiPropertyOptional({
    default: false,
    description:
      'Run hybrid pipeline synchronously instead of enqueueing BullMQ jobs.',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  sync?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  force?: boolean;
}

export class AiStatusQueryDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  workspaceId!: string;
}

export class AiDigestsQueryDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  workspaceId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  repositoryId?: string;
}

export class AiProviderTestDto {
  @ApiProperty({
    enum: [
      'groq',
      'openrouter',
      'huggingface',
      'cloudflare',
      'openai',
      'anthropic',
      'gemini',
      'ollama',
    ],
  })
  @IsIn([
    'groq',
    'openrouter',
    'huggingface',
    'cloudflare',
    'openai',
    'anthropic',
    'gemini',
    'ollama',
  ])
  provider!: SupportedAiProvider;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  workspaceId?: string;
}

export class AiProvidersQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  workspaceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unused?: string;
}
