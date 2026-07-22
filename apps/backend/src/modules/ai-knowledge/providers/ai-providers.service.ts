import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AiProviderRequest,
  AiProviderResult,
  SupportedAiProvider,
} from '../interfaces/ai-knowledge.interfaces';
import {
  parseAnthropicResponse,
  parseCloudflareResponse,
  parseGeminiResponse,
  parseGroqResponse,
  parseHuggingFaceResponse,
  parseOllamaResponse,
  parseOpenAiResponse,
  parseOpenRouterResponse,
  parseProviderJsonContent,
} from './ai-provider-response.parser';
import { AiProviderRateLimiterService } from './ai-provider-rate-limiter.service';

@Injectable()
export class AiProvidersService {
  constructor(
    private readonly configService: ConfigService,
    private readonly rateLimiter: AiProviderRateLimiterService,
  ) {}

  getDefaultProvider(): SupportedAiProvider {
    return (
      (this.configService.get<string>(
        'ai.defaultProvider',
      ) as SupportedAiProvider) ?? 'groq'
    );
  }

  getFailoverProviders(primary?: SupportedAiProvider): SupportedAiProvider[] {
    const preferred = primary ?? this.getDefaultProvider();
    const priority = [
      'groq',
      'openrouter',
      'huggingface',
      'cloudflare',
      'gemini',
    ] as const;
    return priority.filter((provider) => provider !== preferred);
  }

  async generateStructuredJson(
    request: AiProviderRequest,
  ): Promise<AiProviderResult> {
    return this.rateLimiter.schedule(async () => {
      const provider = request.provider ?? this.getDefaultProvider();
      const started = Date.now();

      switch (provider) {
        case 'groq':
          return this.generateGroq(request, started);
        case 'openrouter':
          return this.generateOpenRouter(request, started);
        case 'huggingface':
          return this.generateHuggingFace(request, started);
        case 'cloudflare':
          return this.generateCloudflare(request, started);
        case 'openai':
          return this.generateOpenAi(request, started);
        case 'anthropic':
          return this.generateAnthropic(request, started);
        case 'gemini':
          return this.generateGemini(request, started);
        case 'ollama':
          return this.generateOllama(request, started);
        default: {
          const unsupported = provider as string;
          throw new BadRequestException(
            `Unsupported AI provider: ${unsupported}`,
          );
        }
      }
    });
  }

  private async generateGroq(
    request: AiProviderRequest,
    started: number,
  ): Promise<AiProviderResult> {
    const apiKey = this.configService.get<string>('ai.groq.apiKey');
    const model =
      this.configService.get<string>('ai.groq.model') ?? 'llama-3.1-8b-instant';
    if (!apiKey) {
      throw new InternalServerErrorException('GROQ_API_KEY is not configured');
    }

    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          temperature: request.temperature ?? 0.1,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: request.systemPrompt },
            { role: 'user', content: request.userPrompt },
          ],
        }),
      },
    );
    const data = (await response.json()) as Record<string, unknown>;
    const content = parseGroqResponse(data);
    this.ensureProviderSuccess(response.ok, content || JSON.stringify(data));
    return {
      provider: 'groq',
      model,
      rawText: content,
      output: parseProviderJsonContent(content),
      latencyMs: Date.now() - started,
    };
  }

  private async generateHuggingFace(
    request: AiProviderRequest,
    started: number,
  ): Promise<AiProviderResult> {
    const apiKey = this.configService.get<string>('ai.huggingface.apiKey');
    const model =
      this.configService.get<string>('ai.huggingface.model') ??
      'Qwen/Qwen2.5-7B-Instruct';
    const baseUrl =
      this.configService.get<string>('ai.huggingface.baseUrl') ??
      'https://router.huggingface.co/v1/chat/completions';
    if (!apiKey) {
      throw new InternalServerErrorException(
        'HUGGINGFACE_API_KEY is not configured',
      );
    }

    const controller = new AbortController();
    const timeoutMs = 45_000;
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          temperature: request.temperature ?? 0.1,
          max_tokens: 1024,
          messages: [
            { role: 'system', content: request.systemPrompt },
            { role: 'user', content: request.userPrompt },
          ],
        }),
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new InternalServerErrorException(
          `Hugging Face timed out after ${timeoutMs}ms (model=${model}). Prefer groq/openrouter, or enable Inference Providers credits on Hugging Face.`,
        );
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }

    const data = await this.readJsonBody(response, 'huggingface');
    const content = parseHuggingFaceResponse(data);
    this.ensureProviderSuccess(response.ok, content || JSON.stringify(data));
    return {
      provider: 'huggingface',
      model,
      rawText: content,
      output: parseProviderJsonContent(content),
      latencyMs: Date.now() - started,
    };
  }

  private async generateCloudflare(
    request: AiProviderRequest,
    started: number,
  ): Promise<AiProviderResult> {
    const apiToken = this.configService.get<string>('ai.cloudflare.apiToken');
    const accountId = this.configService.get<string>('ai.cloudflare.accountId');
    const model =
      this.configService.get<string>('ai.cloudflare.model') ??
      '@cf/meta/llama-3.1-8b-instruct';
    if (!apiToken) {
      throw new InternalServerErrorException(
        'CLOUDFLARE_API_TOKEN is not configured',
      );
    }
    if (!accountId) {
      throw new InternalServerErrorException(
        'CLOUDFLARE_ACCOUNT_ID is not configured (required for Workers AI)',
      );
    }

    const url = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/run/${model}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: request.systemPrompt },
          { role: 'user', content: request.userPrompt },
        ],
      }),
    });
    const data = (await response.json()) as Record<string, unknown>;
    const content = parseCloudflareResponse(data);
    this.ensureProviderSuccess(
      response.ok && data.success !== false,
      content || JSON.stringify(data),
    );
    return {
      provider: 'cloudflare',
      model,
      rawText: content,
      output: parseProviderJsonContent(content),
      latencyMs: Date.now() - started,
    };
  }

  private async generateOpenAi(
    request: AiProviderRequest,
    started: number,
  ): Promise<AiProviderResult> {
    const apiKey = this.configService.get<string>('ai.openai.apiKey');
    const model = this.configService.get<string>('ai.openai.model') ?? 'gpt-4o';
    if (!apiKey) {
      throw new InternalServerErrorException(
        'OPENAI_API_KEY is not configured',
      );
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: request.temperature ?? 0.1,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: request.systemPrompt },
          { role: 'user', content: request.userPrompt },
        ],
      }),
    });
    const data = (await response.json()) as Record<string, unknown>;
    const content = parseOpenAiResponse(data);
    this.ensureProviderSuccess(response.ok, content || JSON.stringify(data));
    return {
      provider: 'openai',
      model,
      rawText: content,
      output: parseProviderJsonContent(content),
      latencyMs: Date.now() - started,
    };
  }

  private async generateAnthropic(
    request: AiProviderRequest,
    started: number,
  ): Promise<AiProviderResult> {
    const apiKey = this.configService.get<string>('ai.anthropic.apiKey');
    const model =
      this.configService.get<string>('ai.anthropic.model') ??
      'claude-sonnet-4-20250514';
    if (!apiKey) {
      throw new InternalServerErrorException(
        'ANTHROPIC_API_KEY is not configured',
      );
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: 2048,
        temperature: request.temperature ?? 0.1,
        system: request.systemPrompt,
        messages: [{ role: 'user', content: request.userPrompt }],
      }),
    });
    const data = (await response.json()) as Record<string, unknown>;
    const text = parseAnthropicResponse(data);
    this.ensureProviderSuccess(response.ok, text || JSON.stringify(data));
    return {
      provider: 'anthropic',
      model,
      rawText: text,
      output: parseProviderJsonContent(text),
      latencyMs: Date.now() - started,
    };
  }

  private async generateGemini(
    request: AiProviderRequest,
    started: number,
  ): Promise<AiProviderResult> {
    const apiKey = this.configService.get<string>('ai.gemini.apiKey');
    const model =
      this.configService.get<string>('ai.gemini.model') ?? 'gemini-2.0-flash';
    if (!apiKey) {
      throw new InternalServerErrorException(
        'GOOGLE_AI_API_KEY is not configured',
      );
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: request.systemPrompt }] },
        contents: [{ parts: [{ text: request.userPrompt }] }],
        generationConfig: {
          temperature: request.temperature ?? 0.1,
          responseMimeType: 'application/json',
        },
      }),
    });
    const data = (await response.json()) as Record<string, unknown>;
    const text = parseGeminiResponse(data);
    this.ensureProviderSuccess(response.ok, text || JSON.stringify(data));
    return {
      provider: 'gemini',
      model,
      rawText: text,
      output: parseProviderJsonContent(text),
      latencyMs: Date.now() - started,
    };
  }

  private async generateOpenRouter(
    request: AiProviderRequest,
    started: number,
  ): Promise<AiProviderResult> {
    const apiKey = this.configService.get<string>('ai.openrouter.apiKey');
    const model =
      this.configService.get<string>('ai.openrouter.model') ??
      'openai/gpt-4o-mini';
    if (!apiKey) {
      throw new InternalServerErrorException(
        'OPENROUTER_API_KEY is not configured',
      );
    }

    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          temperature: request.temperature ?? 0.1,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: request.systemPrompt },
            { role: 'user', content: request.userPrompt },
          ],
        }),
      },
    );
    const data = (await response.json()) as Record<string, unknown>;
    const content = parseOpenRouterResponse(data);
    this.ensureProviderSuccess(response.ok, content || JSON.stringify(data));
    return {
      provider: 'openrouter',
      model,
      rawText: content,
      output: parseProviderJsonContent(content),
      latencyMs: Date.now() - started,
    };
  }

  private async generateOllama(
    request: AiProviderRequest,
    started: number,
  ): Promise<AiProviderResult> {
    const isProduction =
      this.configService.get<string>('app.nodeEnv') === 'production' ||
      process.env.NODE_ENV === 'production';
    if (isProduction) {
      throw new InternalServerErrorException(
        'Ollama is disabled in production. Use cloud providers or heuristics-only.',
      );
    }

    const baseUrl =
      this.configService.get<string>('ai.ollama.baseUrl') ??
      'http://127.0.0.1:11434';
    const model =
      this.configService.get<string>('ai.ollama.model') ?? 'llama3.2:1b';

    const endpoint = `${baseUrl.replace(/\/$/, '')}/api/chat`;
    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          stream: false,
          format: 'json',
          options: {
            temperature: request.temperature ?? 0.1,
          },
          messages: [
            { role: 'system', content: request.systemPrompt },
            { role: 'user', content: request.userPrompt },
          ],
        }),
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Ollama is unreachable at ${baseUrl}. Start Ollama and pull the model (${model}). ${
          error instanceof Error ? error.message : ''
        }`,
      );
    }

    const data = (await response.json()) as Record<string, unknown>;
    const content = parseOllamaResponse(data);
    this.ensureProviderSuccess(response.ok, content || JSON.stringify(data));
    return {
      provider: 'ollama',
      model,
      rawText: content,
      output: parseProviderJsonContent(content),
      latencyMs: Date.now() - started,
    };
  }

  private async readJsonBody(
    response: Response,
    providerLabel: string,
  ): Promise<Record<string, unknown>> {
    const raw = await response.text();
    const trimmed = raw.trim();
    if (!trimmed) {
      throw new BadRequestException(
        `${providerLabel} returned an empty response (HTTP ${response.status})`,
      );
    }
    if (trimmed.startsWith('<!') || trimmed.startsWith('<html')) {
      throw new BadRequestException(
        `${providerLabel} returned HTML instead of JSON (HTTP ${response.status}). Usually gateway timeout, invalid token permissions, or the model needs Inference Providers credits. Prefer provider=groq.`,
      );
    }
    try {
      return JSON.parse(trimmed) as Record<string, unknown>;
    } catch {
      throw new BadRequestException(
        `${providerLabel} returned non-JSON (HTTP ${response.status}): ${trimmed.slice(0, 240)}`,
      );
    }
  }

  private ensureProviderSuccess(ok: boolean, detail: string): void {
    if (ok) {
      return;
    }
    throw new BadRequestException(`AI provider call failed: ${detail}`);
  }
}
