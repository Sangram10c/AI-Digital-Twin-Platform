import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class EmbeddingVectorValidatorService {
  validate(vector: number[], expectedDimensions: number): void {
    if (!Array.isArray(vector) || vector.length === 0) {
      throw new BadRequestException('Embedding vector is empty');
    }
    if (vector.length !== expectedDimensions) {
      throw new BadRequestException(
        `Invalid embedding dimensions: expected ${expectedDimensions}, got ${vector.length}`,
      );
    }
    for (let i = 0; i < vector.length; i += 1) {
      const value = vector[i];
      if (
        typeof value !== 'number' ||
        Number.isNaN(value) ||
        !Number.isFinite(value)
      ) {
        throw new BadRequestException(
          `Invalid embedding value at index ${i}: ${String(value)}`,
        );
      }
    }
  }

  toPgVectorLiteral(vector: number[]): string {
    return `[${vector.join(',')}]`;
  }
}
