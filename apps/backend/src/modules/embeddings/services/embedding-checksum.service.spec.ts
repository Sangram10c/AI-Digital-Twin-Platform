import { EmbeddingChecksumService } from './embedding-checksum.service';

describe('EmbeddingChecksumService', () => {
  const service = new EmbeddingChecksumService();

  it('hashes content with sha256', () => {
    const hash = service.hashContent('hello world');
    expect(hash).toHaveLength(64);
    expect(hash).toBe(service.hashContent('hello world'));
  });

  it('prefers valid contentHash over recomputing', () => {
    const contentHash = service.hashContent('stored');
    expect(
      service.resolveChunkChecksum({ content: 'different', contentHash }),
    ).toBe(contentHash);
  });

  it('falls back to hashing content when contentHash invalid', () => {
    const expected = service.hashContent('live');
    expect(
      service.resolveChunkChecksum({ content: 'live', contentHash: 'nope' }),
    ).toBe(expected);
  });
});
