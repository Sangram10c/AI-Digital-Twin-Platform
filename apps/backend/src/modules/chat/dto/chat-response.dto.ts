// ============================================================
// Chat Module — Response DTOs (Swagger serialization)
// ============================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ────────────────────────────────────────────────────────────
// Citation
// ────────────────────────────────────────────────────────────

export class CitationRefDto {
  @ApiProperty({ example: 1 })
  index!: number;

  @ApiProperty({ example: 'ckuid1...' })
  knowledgeChunkId!: string;

  @ApiPropertyOptional({ nullable: true })
  knowledgeSourceId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  documentationId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  repositoryId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  repositoryName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  filePath!: string | null;

  @ApiPropertyOptional({ nullable: true })
  externalRefId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  title!: string | null;

  @ApiProperty({
    example: 'const token = sign(payload, secret, { expiresIn })',
  })
  excerpt!: string;

  @ApiProperty({ example: 0.92 })
  relevanceScore!: number;

  @ApiPropertyOptional({ nullable: true })
  url?: string;
}

// ────────────────────────────────────────────────────────────
// Source
// ────────────────────────────────────────────────────────────

export class ChatSourceDto {
  @ApiPropertyOptional({ nullable: true })
  repositoryId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  repositoryName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  filePath!: string | null;

  @ApiPropertyOptional({ nullable: true })
  title!: string | null;

  @ApiProperty({ example: 0.87 })
  relevanceScore!: number;

  @ApiPropertyOptional({ nullable: true })
  externalRefId!: string | null;
}

// ────────────────────────────────────────────────────────────
// Token Usage
// ────────────────────────────────────────────────────────────

export class TokenUsageDto {
  @ApiProperty({ example: 1820 })
  promptTokens!: number;

  @ApiProperty({ example: 312 })
  completionTokens!: number;

  @ApiProperty({ example: 2132 })
  totalTokens!: number;
}

// ────────────────────────────────────────────────────────────
// Full Chat Response
// ────────────────────────────────────────────────────────────

export class ChatResponseDto {
  @ApiProperty({
    description: 'Conversation UUID (new or resumed).',
    example: '550e8400...',
  })
  conversationId!: string;

  @ApiProperty({
    description: 'Assistant message UUID.',
    example: 'msg-abc123',
  })
  messageId!: string;

  @ApiProperty({
    description:
      'The AI-generated answer, grounded in the retrieved knowledge chunks.',
    example:
      'JWT refresh token rotation was introduced in commit abc1234 by modifying `auth.service.ts`...',
  })
  answer!: string;

  @ApiProperty({
    type: [CitationRefDto],
    description: 'Source chunks referenced in the answer.',
  })
  citations!: CitationRefDto[];

  @ApiProperty({
    type: [ChatSourceDto],
    description: 'Unique source files/documents.',
  })
  sources!: ChatSourceDto[];

  @ApiProperty({
    description:
      'Confidence score 0.0–1.0 (heuristic based on citation quality).',
    example: 0.9,
  })
  confidence!: number;

  @ApiProperty({ example: 'groq' })
  providerUsed!: string;

  @ApiProperty({ example: 'llama-3.1-8b-instant' })
  modelUsed!: string;

  @ApiProperty({
    description: 'Total wall-clock time in milliseconds.',
    example: 1823,
  })
  executionTimeMs!: number;

  @ApiProperty({ type: TokenUsageDto })
  tokenUsage!: TokenUsageDto;

  @ApiProperty({ example: 1, description: 'Prompt template version used.' })
  promptVersion!: number;

  @ApiProperty({
    example: false,
    description: 'True when a secondary provider was used.',
  })
  fallbackUsed!: boolean;
}

// ────────────────────────────────────────────────────────────
// Conversation list / detail response
// ────────────────────────────────────────────────────────────

export class ConversationMessageDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: ['user', 'assistant', 'system'] })
  role!: string;

  @ApiProperty()
  content!: string;

  @ApiProperty()
  sequenceNumber!: number;

  @ApiPropertyOptional({ nullable: true })
  tokenCount!: number | null;

  @ApiProperty()
  createdAt!: Date;
}

export class ConversationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional({ nullable: true })
  title!: string | null;

  @ApiProperty()
  workspaceId!: string;

  @ApiPropertyOptional({ nullable: true })
  repositoryId!: string | null;

  @ApiProperty()
  messageCount!: number;

  @ApiPropertyOptional({ type: [ConversationMessageDto] })
  messages?: ConversationMessageDto[];

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class ConversationListResponseDto {
  @ApiProperty({ type: [ConversationResponseDto] })
  data!: ConversationResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  hasMore!: boolean;
}
