import {
  EmbeddingBatchResult,
  EmbeddingProvider,
  EmbeddingVectorResult,
} from '../interfaces/embeddings.interfaces';
import { EmbeddingProviderName } from '../constants/embeddings.constants';

/**
 * Google Gemini embedding API (`gemini-embedding-001`).
 * Legacy `text-embedding-004` is no longer available on v1beta.
 */
export class GeminiEmbeddingProvider implements EmbeddingProvider {
  constructor(
    private readonly apiKey: string,
    private readonly modelName: string,
    private readonly dims: number,
  ) {}

  providerName(): EmbeddingProviderName {
    return 'gemini';
  }

  model(): string {
    return this.modelName;
  }

  dimensions(): number {
    return this.dims;
  }

  health(): Promise<{ ok: boolean; detail?: string }> {
    if (!this.apiKey) {
      return Promise.resolve({
        ok: false,
        detail: 'GOOGLE_AI_API_KEY missing',
      });
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
      throw new Error('GOOGLE_AI_API_KEY is not configured');
    }

    // batchEmbedContents for multiple texts
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.modelName)}:batchEmbedContents?key=${encodeURIComponent(this.apiKey)}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: texts.map((text) => ({
          model: `models/${this.modelName}`,
          content: { parts: [{ text }] },
          outputDimensionality: this.dims,
        })),
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Gemini embeddings failed (${response.status}): ${body}`);
    }

    const data = (await response.json()) as {
      embeddings?: Array<{ values?: number[] }>;
    };

    const embeddings = (data.embeddings ?? []).map((row) => row.values ?? []);
    return {
      embeddings,
      tokenUsage: texts.reduce(
        (sum, t) => sum + Math.max(1, Math.ceil(t.length / 4)),
        0,
      ),
    };
  }
}
