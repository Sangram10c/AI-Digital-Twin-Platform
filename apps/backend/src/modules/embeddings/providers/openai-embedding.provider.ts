import {
  EmbeddingBatchResult,
  EmbeddingProvider,
  EmbeddingVectorResult,
} from '../interfaces/embeddings.interfaces';
import { EmbeddingProviderName } from '../constants/embeddings.constants';

export class OpenAiEmbeddingProvider implements EmbeddingProvider {
  constructor(
    private readonly apiKey: string,
    private readonly modelName: string,
    private readonly dims: number,
    private readonly orgId?: string,
  ) {}

  providerName(): EmbeddingProviderName {
    return 'openai';
  }

  model(): string {
    return this.modelName;
  }

  dimensions(): number {
    return this.dims;
  }

  health(): Promise<{ ok: boolean; detail?: string }> {
    if (!this.apiKey) {
      return Promise.resolve({ ok: false, detail: 'OPENAI_API_KEY missing' });
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
      throw new Error('OPENAI_API_KEY is not configured');
    }
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
    if (this.orgId) headers['OpenAI-Organization'] = this.orgId;

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: this.modelName,
        input: texts,
        dimensions: this.dims,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenAI embeddings failed (${response.status}): ${body}`);
    }

    const data = (await response.json()) as {
      data?: Array<{ embedding: number[]; index: number }>;
      usage?: { total_tokens?: number };
    };

    const sorted = [...(data.data ?? [])].sort((a, b) => a.index - b.index);
    return {
      embeddings: sorted.map((row) => row.embedding),
      tokenUsage: data.usage?.total_tokens,
    };
  }
}
