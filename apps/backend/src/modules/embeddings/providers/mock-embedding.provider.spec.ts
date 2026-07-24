import { MockEmbeddingProvider } from '../providers/mock-embedding.provider';

describe('MockEmbeddingProvider', () => {
  const provider = new MockEmbeddingProvider('mock-v1', 32);

  it('reports metadata', () => {
    expect(provider.providerName()).toBe('mock');
    expect(provider.model()).toBe('mock-v1');
    expect(provider.dimensions()).toBe(32);
  });

  it('returns deterministic vectors of expected size', async () => {
    const a = await provider.generateEmbedding('alpha');
    const b = await provider.generateEmbedding('alpha');
    const c = await provider.generateEmbedding('beta');
    expect(a.embedding).toHaveLength(32);
    expect(a.embedding).toEqual(b.embedding);
    expect(a.embedding).not.toEqual(c.embedding);
    expect(a.embedding.every((v) => Number.isFinite(v))).toBe(true);
  });

  it('batches embeddings', async () => {
    const batch = await provider.generateEmbeddings(['one', 'two']);
    expect(batch.embeddings).toHaveLength(2);
    expect(batch.embeddings[0]).toHaveLength(32);
  });
});
