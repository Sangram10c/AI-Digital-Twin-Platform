import {
  EmbeddingBatchResult,
  EmbeddingProvider,
  EmbeddingVectorResult,
} from '../interfaces/embeddings.interfaces';
import { EmbeddingProviderName } from '../constants/embeddings.constants';

/**
 * Groq embeddings (OpenAI-compatible).
 * Default model: nomic-embed-text-v1_5
 * Docs: POST https://api.groq.com/openai/v1/embeddings
 */
export class GroqEmbeddingProvider implements EmbeddingProvider {
  constructor(
    private readonly apiKey: string,
    private readonly modelName: string,
    private readonly dims: number,
  ) {}

  providerName(): EmbeddingProviderName {
    return 'groq';
  }

  model(): string {
    return this.modelName;
  }

  dimensions(): number {
    return this.dims;
  }

  health(): Promise<{ ok: boolean; detail?: string }> {
    if (!this.apiKey) {
      return Promise.resolve({ ok: false, detail: 'GROQ_API_KEY missing' });
    }
    return Promise.resolve({ ok: true });
  }

  async generateEmbedding(text: string): Promise<EmbeddingVectorResult> {
    const batch = await this.generateEmbeddings([text]);
    return {
      embedding: batch.embeddings[0] ?? [],
      tokenUsage: batch.tokenUsage,
    };
  }

  async generateEmbeddings(texts: string[]): Promise<EmbeddingBatchResult> {
    if (!this.apiKey) {
      throw new Error('GROQ_API_KEY is not configured');
    }

    const response = await fetch('https://api.groq.com/openai/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.modelName,
        input: texts,
        encoding_format: 'float',
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Groq embeddings failed (${response.status}): ${body}`);
    }

    const data = (await response.json()) as {
      data?: Array<{ embedding: number[]; index: number }>;
      usage?: { total_tokens?: number };
    };

    const sorted = [...(data.data ?? [])].sort((a, b) => a.index - b.index);
    return {
      embeddings: sorted.map((row) => this.padOrTrim(row.embedding)),
      tokenUsage: data.usage?.total_tokens,
    };
  }

  /** Align to configured/pgvector dimensions (Groq nomic is often 768). */
  private padOrTrim(vector: number[]): number[] {
    if (vector.length === this.dims) return vector;
    if (vector.length > this.dims) return vector.slice(0, this.dims);
    const padding: number[] = new Array<number>(this.dims - vector.length).fill(
      0,
    );
    return vector.concat(padding);
  }
}
