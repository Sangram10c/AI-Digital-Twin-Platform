import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WebhookEventStatus, WebhookEventType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class GithubWebhookQueryDto {
  @ApiPropertyOptional({
    description:
      'Optional workspace hint when the payload has no repository (e.g. org-level hooks). Prefer embedding in the webhook URL.',
  })
  @IsOptional()
  @IsUUID()
  workspaceId?: string;

  @ApiPropertyOptional({
    description:
      'Optional connected account id hint (must belong to workspaceId).',
  })
  @IsOptional()
  @IsUUID()
  connectedAccountId?: string;
}

export class WebhookAcceptResponseDto {
  @ApiProperty()
  accepted!: boolean;

  @ApiProperty()
  duplicate!: boolean;

  @ApiProperty()
  ignored!: boolean;

  @ApiPropertyOptional()
  webhookEventId?: string;

  @ApiPropertyOptional()
  jobId?: string;

  @ApiProperty()
  message!: string;
}

export class ListWebhookEventsQueryDto {
  @ApiProperty()
  @IsUUID()
  workspaceId!: string;

  @ApiPropertyOptional({ enum: WebhookEventStatus })
  @IsOptional()
  @IsEnum(WebhookEventStatus)
  status?: WebhookEventStatus;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}

export class WebhookEventSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  workspaceId!: string;

  @ApiProperty()
  connectedAccountId!: string;

  @ApiPropertyOptional()
  providerEventId?: string | null;

  @ApiProperty({ enum: WebhookEventType })
  eventType!: WebhookEventType;

  @ApiPropertyOptional()
  action?: string | null;

  @ApiProperty()
  signatureValid!: boolean;

  @ApiProperty({ enum: WebhookEventStatus })
  status!: WebhookEventStatus;

  @ApiPropertyOptional()
  errorMessage?: string | null;

  @ApiProperty()
  receivedAt!: Date;

  @ApiPropertyOptional()
  processedAt?: Date | null;
}

export class WebhookStatisticsQueryDto {
  @ApiProperty()
  @IsUUID()
  workspaceId!: string;
}
