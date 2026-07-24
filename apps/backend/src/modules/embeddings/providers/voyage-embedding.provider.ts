import {
  EmbeddingBatchResult,
  EmbeddingProvider,
  EmbeddingVectorResult,
} from '../interfaces/embeddings.interfaces';
import { EmbeddingProviderName } from '../constants/embeddings.constants';

export class VoyageEmbeddingProvider implements EmbeddingProvider {
  constructor(
    private readonly apiKey: string,
    private readonly modelName: string,
    private readonly dims: number,
  ) {}

  providerName(): EmbeddingProviderName {
    return 'voyage';
  }

  model(): string {
    return this.modelName;
  }

  dimensions(): number {
    return this.dims;
  }

  health(): Promise<{ ok: boolean; detail?: string }> {
    if (!this.apiKey) {
      return Promise.resolve({ ok: false, detail: 'VOYAGE_API_KEY missing' });
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
      throw new Error('VOYAGE_API_KEY is not configured');
    }
    const response = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.modelName,
        input: texts,
        input_type: 'document',
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Voyage embeddings failed (${response.status}): ${body}`);
    }

    const data = (await response.json()) as {
      data?: Array<{ embedding: number[] }>;
      usage?: { total_tokens?: number };
    };

    return {
      embeddings: (data.data ?? []).map((row) => row.embedding),
      tokenUsage: data.usage?.total_tokens,
    };
  }
}
