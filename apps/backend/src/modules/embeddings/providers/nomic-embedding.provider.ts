import {
  EmbeddingBatchResult,
  EmbeddingProvider,
  EmbeddingVectorResult,
} from '../interfaces/embeddings.interfaces';
import { EmbeddingProviderName } from '../constants/embeddings.constants';

/**
 * Nomic embeddings via OpenAI-compatible Atlas API.
 */
export class NomicEmbeddingProvider implements EmbeddingProvider {
  constructor(
    private readonly apiKey: string,
    private readonly modelName: string,
    private readonly dims: number,
    private readonly baseUrl = 'https://api-atlas.nomic.ai/v1/embeddings',
  ) {}

  providerName(): EmbeddingProviderName {
    return 'nomic';
  }

  model(): string {
    return this.modelName;
  }

  dimensions(): number {
    return this.dims;
  }

  health(): Promise<{ ok: boolean; detail?: string }> {
    if (!this.apiKey) {
      return Promise.resolve({ ok: false, detail: 'NOMIC_API_KEY missing' });
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
      throw new Error('NOMIC_API_KEY is not configured');
    }
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.modelName,
        input: texts,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Nomic embeddings failed (${response.status}): ${body}`);
    }

    const data = (await response.json()) as {
      data?: Array<{ embedding: number[]; index?: number }>;
      usage?: { total_tokens?: number };
    };

    const rows = [...(data.data ?? [])].sort(
      (a, b) => (a.index ?? 0) - (b.index ?? 0),
    );
    return {
      embeddings: rows.map((row) => row.embedding),
      tokenUsage: data.usage?.total_tokens,
    };
  }
}
