import {
  EmbeddingBatchResult,
  EmbeddingProvider,
  EmbeddingVectorResult,
} from '../interfaces/embeddings.interfaces';
import { EmbeddingProviderName } from '../constants/embeddings.constants';

/**
 * Local Ollama embeddings — never used as a production default.
 */
export class LocalEmbeddingProvider implements EmbeddingProvider {
  constructor(
    private readonly baseUrl: string,
    private readonly modelName: string,
    private readonly dims: number,
  ) {}

  providerName(): EmbeddingProviderName {
    return 'local';
  }

  model(): string {
    return this.modelName;
  }

  dimensions(): number {
    return this.dims;
  }

  async health(): Promise<{ ok: boolean; detail?: string }> {
    try {
      const response = await fetch(
        `${this.baseUrl.replace(/\/$/, '')}/api/tags`,
      );
      if (!response.ok) {
        return { ok: false, detail: `Ollama HTTP ${response.status}` };
      }
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        detail: error instanceof Error ? error.message : 'unreachable',
      };
    }
  }

  async generateEmbedding(text: string): Promise<EmbeddingVectorResult> {
    const batch = await this.generateEmbeddings([text]);
    return {
      embedding: batch.embeddings[0] ?? [],
      tokenUsage: batch.tokenUsage,
    };
  }

  async generateEmbeddings(texts: string[]): Promise<EmbeddingBatchResult> {
    const embeddings: number[][] = [];
    let tokenUsage = 0;
    for (const text of texts) {
      const response = await fetch(
        `${this.baseUrl.replace(/\/$/, '')}/api/embeddings`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: this.modelName, prompt: text }),
        },
      );
      if (!response.ok) {
        const body = await response.text();
        throw new Error(
          `Local (Ollama) embeddings failed (${response.status}): ${body}`,
        );
      }
      const data = (await response.json()) as { embedding?: number[] };
      const vector = data.embedding ?? [];
      embeddings.push(this.padOrTrim(vector));
      tokenUsage += Math.max(1, Math.ceil(text.length / 4));
    }
    return { embeddings, tokenUsage };
  }

  private padOrTrim(vector: number[]): number[] {
    if (vector.length === this.dims) return vector;
    if (vector.length > this.dims) return vector.slice(0, this.dims);
    const padding: number[] = new Array<number>(this.dims - vector.length).fill(
      0,
    );
    return vector.concat(padding);
  }
}
