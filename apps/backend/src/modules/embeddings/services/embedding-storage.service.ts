import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { EmbeddingVectorValidatorService } from './embedding-vector-validator.service';

export interface UpsertEmbeddingInput {
  knowledgeChunkId: string;
  provider: string;
  model: string;
  version: number;
  dimensions: number;
  checksum: string;
  vector: number[];
  latencyMs?: number;
  tokenUsage?: number;
  status?: EmbeddingStatus;
}

@Injectable()
export class EmbeddingStorageService {
  private readonly logger = new Logger(EmbeddingStorageService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly validator: EmbeddingVectorValidatorService,
  ) {}

  async findByChunkId(knowledgeChunkId: string) {
    return this.prisma.embedding.findUnique({ where: { knowledgeChunkId } });
  }

  async markProcessing(
    knowledgeChunkId: string,
    meta?: { provider?: string; model?: string; dimensions?: number },
  ): Promise<void> {
    const provider = meta?.provider ?? 'pending';
    const model = meta?.model ?? 'pending';
    const dimensions = meta?.dimensions ?? 1536;
    await this.prisma.embedding.upsert({
      where: { knowledgeChunkId },
      create: {
        knowledgeChunkId,
        provider,
        model,
        status: EmbeddingStatus.PROCESSING,
        dimensions,
      },
      update: {
        status: EmbeddingStatus.PROCESSING,
        provider,
        model,
        dimensions,
      },
    });
  }

  async markFailed(
    knowledgeChunkId: string,
    errorMessage: string,
    retryCount = 0,
    meta?: { provider?: string; model?: string },
  ): Promise<void> {
    const provider = meta?.provider ?? 'unknown';
    const model = meta?.model ?? 'unknown';
    await this.prisma.embedding.upsert({
      where: { knowledgeChunkId },
      create: {
        knowledgeChunkId,
        provider,
        model,
        status: EmbeddingStatus.FAILED,
        dimensions: 1536,
        errorMessage: errorMessage.slice(0, 4000),
        retryCount,
      },
      update: {
        status: EmbeddingStatus.FAILED,
        provider,
        model,
        errorMessage: errorMessage.slice(0, 4000),
        retryCount,
      },
    });
  }

  async markDeleted(knowledgeChunkId: string): Promise<void> {
    const existing = await this.findByChunkId(knowledgeChunkId);
    if (!existing) return;
    await this.prisma.$executeRaw`
      UPDATE embeddings
      SET vector = NULL,
          status = 'DELETED'::"EmbeddingStatus",
          updated_at = NOW()
      WHERE knowledge_chunk_id = ${knowledgeChunkId}::uuid
    `;
  }

  async upsertWithVector(input: UpsertEmbeddingInput): Promise<string> {
    this.validator.validate(input.vector, input.dimensions);
    const literal = this.validator.toPgVectorLiteral(input.vector);

    const row = await this.prisma.embedding.upsert({
      where: { knowledgeChunkId: input.knowledgeChunkId },
      create: {
        knowledgeChunkId: input.knowledgeChunkId,
        provider: input.provider,
        model: input.model,
        version: input.version,
        dimensions: input.dimensions,
        status: input.status ?? EmbeddingStatus.COMPLETED,
        checksum: input.checksum,
        latencyMs: input.latencyMs,
        tokenUsage: input.tokenUsage,
        retryCount: 0,
        errorMessage: null,
      },
      update: {
        provider: input.provider,
        model: input.model,
        version: input.version,
        dimensions: input.dimensions,
        status: input.status ?? EmbeddingStatus.COMPLETED,
        checksum: input.checksum,
        latencyMs: input.latencyMs,
        tokenUsage: input.tokenUsage,
        errorMessage: null,
      },
    });

    await this.prisma.$executeRawUnsafe(
      `UPDATE embeddings
       SET vector = $1::vector,
           status = 'COMPLETED'::"EmbeddingStatus",
           updated_at = NOW()
       WHERE id = $2::uuid`,
      literal,
      row.id,
    );

    this.logger.debug(
      `Stored embedding ${row.id} chunk=${input.knowledgeChunkId} dims=${input.dimensions}`,
    );
    return row.id;
  }
}
