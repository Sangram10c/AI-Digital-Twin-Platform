import { BadRequestException } from '@nestjs/common';
import { EmbeddingVectorValidatorService } from './embedding-vector-validator.service';

describe('EmbeddingVectorValidatorService', () => {
  const service = new EmbeddingVectorValidatorService();

  it('accepts valid vectors', () => {
    expect(() => service.validate([0.1, -0.2, 0.3], 3)).not.toThrow();
  });

  it('rejects wrong dimensions', () => {
    expect(() => service.validate([1, 2], 3)).toThrow(BadRequestException);
  });

  it('rejects NaN and Infinity', () => {
    expect(() => service.validate([1, Number.NaN, 3], 3)).toThrow(
      BadRequestException,
    );
    expect(() => service.validate([1, Number.POSITIVE_INFINITY, 3], 3)).toThrow(
      BadRequestException,
    );
  });

  it('formats pgvector literal', () => {
    expect(service.toPgVectorLiteral([1, 2, 3])).toBe('[1,2,3]');
  });
});
