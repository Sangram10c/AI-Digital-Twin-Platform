import { createHash } from 'crypto';
import {
  EmbeddingBatchResult,
  EmbeddingProvider,
  EmbeddingVectorResult,
} from '../interfaces/embeddings.interfaces';
import { EmbeddingProviderName } from '../constants/embeddings.constants';

/**
 * Deterministic mock embeddings for tests / offline — not for production RAG quality.
 */
export class MockEmbeddingProvider implements EmbeddingProvider {
  constructor(
    private readonly modelName = 'mock-embedding-v1',
    private readonly dims = 1536,
  ) {}

  providerName(): EmbeddingProviderName {
    return 'mock';
  }

  model(): string {
    return this.modelName;
  }

  dimensions(): number {
    return this.dims;
  }

  health(): Promise<{ ok: boolean; detail?: string }> {
    return Promise.resolve({ ok: true, detail: 'mock always healthy' });
  }

  generateEmbedding(text: string): Promise<EmbeddingVectorResult> {
    return Promise.resolve({
      embedding: this.hashToVector(text),
      tokenUsage: Math.max(1, Math.ceil(text.length / 4)),
    });
  }

  generateEmbeddings(texts: string[]): Promise<EmbeddingBatchResult> {
    const embeddings = texts.map((t) => this.hashToVector(t));
    const tokenUsage = texts.reduce(
      (sum, t) => sum + Math.max(1, Math.ceil(t.length / 4)),
      0,
    );
    return Promise.resolve({ embeddings, tokenUsage });
  }

  private hashToVector(text: string): number[] {
    const vector = new Array<number>(this.dims).fill(0);
    const normalized = text.trim().toLowerCase() || 'empty';
    for (let i = 0; i < this.dims; i += 1) {
      const digest = createHash('sha256').update(`${normalized}:${i}`).digest();
      // Map bytes to [-1, 1]
      const value = ((digest[0] << 8) | digest[1]) / 65535;
      vector[i] = value * 2 - 1;
    }
    // L2 normalize
    const norm = Math.sqrt(vector.reduce((s, v) => s + v * v, 0)) || 1;
    return vector.map((v) => v / norm);
  }
}
