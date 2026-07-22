import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import {
  AI_FREE_PROVIDER_PRIORITY,
  AI_PAID_PROVIDERS,
  HYBRID_DEFAULTS,
} from '../constants/hybrid-pipeline.constants';
import {
  AiProviderRequest,
  AiProviderResult,
  SupportedAiProvider,
} from '../interfaces/ai-knowledge.interfaces';
import { AiProvidersService } from './ai-providers.service';

const RETRIABLE_PATTERNS = [
  /429/,
  /quota/i,
  /rate.?limit/i,
  /credit/i,
  /exhausted/i,
  /timeout/i,
  /ETIMEDOUT/i,
  /ECONNREFUSED/i,
  /unreachable/i,
  /503/,
  /502/,
  /overloaded/i,
];

export interface ProviderFallbackResult extends AiProviderResult {
  attemptedProviders: SupportedAiProvider[];
  failedProviders: Array<{ provider: SupportedAiProvider; error: string }>;
  fallbackUsed: boolean;
  allCloudProvidersFailed: boolean;
  /** @deprecated alias of allCloudProvidersFailed */
  allProvidersFailed: boolean;
  usedHeuristicsFallback?: boolean;
  usedOllamaLastResort?: boolean;
}

@Injectable()
export class AiProviderFallbackService {
  private readonly logger = new Logger(AiProviderFallbackService.name);

  constructor(
    private readonly providers: AiProvidersService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  isProduction(): boolean {
    return (
      this.configService.get<string>('app.nodeEnv') === 'production' ||
      process.env.NODE_ENV === 'production'
    );
  }

  /**
   * Cloud priority. In free_only mode, paid providers are excluded.
   * Ollama is intentionally excluded from this chain.
   */
  getProviderPriority(preferred?: SupportedAiProvider): SupportedAiProvider[] {
    const billingMode = (
      this.configService.get<string>('ai.billingMode') ?? 'free_only'
    ).toLowerCase();
    const configured = this.configService.get<string>('ai.defaultProvider') as
      SupportedAiProvider | undefined;
    const primary = preferred ?? configured ?? 'groq';
    const cloudPrimary = primary === 'ollama' ? 'groq' : primary;

    const baseList =
      billingMode === 'free_only'
        ? [...AI_FREE_PROVIDER_PRIORITY]
        : [...AI_FREE_PROVIDER_PRIORITY, ...AI_PAID_PROVIDERS];

    // Never put paid providers first in free_only even if preferred
    if (
      billingMode === 'free_only' &&
      (AI_PAID_PROVIDERS as readonly string[]).includes(cloudPrimary)
    ) {
      return baseList.filter((provider) => this.isProviderEnabled(provider));
    }

    const ordered = [
      cloudPrimary,
      ...baseList.filter((p) => p !== cloudPrimary),
    ] as SupportedAiProvider[];

    return ordered.filter((provider) => this.isProviderEnabled(provider));
  }

  isProviderEnabled(provider: SupportedAiProvider): boolean {
    const billingMode = (
      this.configService.get<string>('ai.billingMode') ?? 'free_only'
    ).toLowerCase();
    if (
      billingMode === 'free_only' &&
      (AI_PAID_PROVIDERS as readonly string[]).includes(provider)
    ) {
      return false;
    }

    switch (provider) {
      case 'groq':
        return Boolean(this.configService.get<string>('ai.groq.apiKey'));
      case 'openrouter':
        return Boolean(this.configService.get<string>('ai.openrouter.apiKey'));
      case 'huggingface':
        return Boolean(this.configService.get<string>('ai.huggingface.apiKey'));
      case 'cloudflare':
        return Boolean(
          this.configService.get<string>('ai.cloudflare.apiToken') &&
          this.configService.get<string>('ai.cloudflare.accountId'),
        );
      case 'openai':
        return Boolean(this.configService.get<string>('ai.openai.apiKey'));
      case 'anthropic':
        return Boolean(this.configService.get<string>('ai.anthropic.apiKey'));
      case 'gemini':
        return Boolean(this.configService.get<string>('ai.gemini.apiKey'));
      case 'ollama': {
        if (this.isProduction()) return false;
        return this.configService.get<boolean>('ai.ollama.enabled') === true;
      }
      default:
        return false;
    }
  }

  async getProvidersStatus(): Promise<
    Array<{
      provider: SupportedAiProvider;
      enabled: boolean;
      configured: boolean;
      model?: string;
      productionBlocked?: boolean;
    }>
  > {
    const list: SupportedAiProvider[] = [
      'groq',
      'openrouter',
      'huggingface',
      'cloudflare',
      'gemini',
      'openai',
      'anthropic',
      'ollama',
    ];
    return await Promise.resolve(
      list.map((provider) => ({
        provider,
        enabled: this.isProviderEnabled(provider),
        configured:
          provider === 'ollama'
            ? Boolean(this.configService.get<string>('ai.ollama.baseUrl'))
            : this.isProviderEnabled(provider) ||
              (provider === 'cloudflare' &&
                Boolean(
                  this.configService.get<string>('ai.cloudflare.apiToken'),
                )),
        model: this.getModel(provider),
        productionBlocked: provider === 'ollama' && this.isProduction(),
      })),
    );
  }

  async testProvider(provider: SupportedAiProvider): Promise<{
    ok: boolean;
    provider: SupportedAiProvider;
    model?: string;
    latencyMs?: number;
    error?: string;
  }> {
    if (provider === 'ollama' && this.isProduction()) {
      return {
        ok: false,
        provider,
        model: this.getModel(provider),
        error: 'Ollama is disabled in production',
      };
    }
    const started = Date.now();
    try {
      const result = await this.providers.generateStructuredJson({
        provider,
        systemPrompt: 'Return valid JSON only.',
        userPrompt: '{"ping":true,"message":"ok"}',
        temperature: 0,
      });
      return {
        ok: true,
        provider: result.provider,
        model: result.model,
        latencyMs: result.latencyMs ?? Date.now() - started,
      };
    } catch (error) {
      return {
        ok: false,
        provider,
        model: this.getModel(provider),
        latencyMs: Date.now() - started,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Cloud providers only. Does not call Ollama.
   * Caller applies heuristics, then optionally tryOllamaLastResort().
   */
  async generateWithFallback(
    request: AiProviderRequest,
    context: {
      workspaceId: string;
      aiAnalysisId?: string;
    },
  ): Promise<ProviderFallbackResult> {
    const fallbackEnabled =
      this.configService.get<boolean>('ai.providerFallback') ?? true;
    const chain = this.getProviderPriority(
      request.provider === 'ollama' ? undefined : request.provider,
    );
    const attempted: SupportedAiProvider[] = [];
    const failed: Array<{ provider: SupportedAiProvider; error: string }> = [];

    if (chain.length === 0) {
      this.logger.warn(
        'No cloud AI providers configured — will use heuristics',
      );
      return {
        provider: 'groq',
        model: 'none',
        rawText: '',
        output: {},
        latencyMs: 0,
        attemptedProviders: [],
        failedProviders: [],
        fallbackUsed: false,
        allCloudProvidersFailed: true,
        allProvidersFailed: true,
      };
    }

    for (let i = 0; i < chain.length; i += 1) {
      const provider = chain[i];
      attempted.push(provider);
      try {
        const result = await this.providers.generateStructuredJson({
          ...request,
          provider,
        });
        await this.recordExecution({
          workspaceId: context.workspaceId,
          aiAnalysisId: context.aiAnalysisId,
          provider,
          model: result.model,
          success: true,
          latencyMs: result.latencyMs,
        });
        return {
          ...result,
          attemptedProviders: attempted,
          failedProviders: failed,
          fallbackUsed: i > 0,
          allCloudProvidersFailed: false,
          allProvidersFailed: false,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        failed.push({ provider, error: message });
        await this.recordFailure({
          workspaceId: context.workspaceId,
          aiAnalysisId: context.aiAnalysisId,
          provider,
          errorMessage: message,
        });
        await this.recordExecution({
          workspaceId: context.workspaceId,
          aiAnalysisId: context.aiAnalysisId,
          provider,
          success: false,
          latencyMs: 0,
          responseMeta: { error: message },
        });

        const retriable = this.isRetriableProviderError(message);
        this.logger.warn(
          `Cloud provider ${provider} failed (${retriable ? 'retriable' : 'fatal'}): ${message}`,
        );

        if (!fallbackEnabled) {
          break;
        }
      }
    }

    return {
      provider: attempted[0] ?? 'groq',
      model: 'none',
      rawText: '',
      output: {},
      latencyMs: 0,
      attemptedProviders: attempted,
      failedProviders: failed,
      fallbackUsed: true,
      allCloudProvidersFailed: true,
      allProvidersFailed: true,
    };
  }

  /**
   * Last resort after heuristics is insufficient. Blocked in production.
   */
  async tryOllamaLastResort(
    request: AiProviderRequest,
    context: {
      workspaceId: string;
      aiAnalysisId?: string;
    },
  ): Promise<ProviderFallbackResult | null> {
    if (this.isProduction()) {
      this.logger.warn('Skipping Ollama last-resort — production environment');
      return null;
    }
    if (!this.isProviderEnabled('ollama')) {
      this.logger.warn('Ollama last-resort unavailable (OLLAMA_ENABLED=false)');
      return null;
    }

    try {
      const result = await this.providers.generateStructuredJson({
        ...request,
        provider: 'ollama',
      });
      await this.recordExecution({
        workspaceId: context.workspaceId,
        aiAnalysisId: context.aiAnalysisId,
        provider: 'ollama',
        model: result.model,
        success: true,
        latencyMs: result.latencyMs,
      });
      return {
        ...result,
        attemptedProviders: ['ollama'],
        failedProviders: [],
        fallbackUsed: true,
        allCloudProvidersFailed: true,
        allProvidersFailed: false,
        usedOllamaLastResort: true,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.recordFailure({
        workspaceId: context.workspaceId,
        aiAnalysisId: context.aiAnalysisId,
        provider: 'ollama',
        errorMessage: message,
      });
      this.logger.warn(`Ollama last-resort failed: ${message}`);
      return null;
    }
  }

  isHeuristicsInsufficient(snapshot: Record<string, unknown>): boolean {
    const confidence =
      typeof snapshot.confidenceScore === 'number'
        ? snapshot.confidenceScore
        : 0;
    const frameworks = Array.isArray(snapshot.frameworks)
      ? snapshot.frameworks
      : [];
    const modules = Array.isArray(snapshot.modules) ? snapshot.modules : [];
    const technologies = Array.isArray(snapshot.technologies)
      ? snapshot.technologies
      : [];
    const min = HYBRID_DEFAULTS.heuristicsMinConfidence;
    return (
      confidence < min &&
      frameworks.length === 0 &&
      modules.length === 0 &&
      technologies.length === 0
    );
  }

  isRetriableProviderError(message: string): boolean {
    return RETRIABLE_PATTERNS.some((pattern) => pattern.test(message));
  }

  private getModel(provider: SupportedAiProvider): string | undefined {
    switch (provider) {
      case 'groq':
        return this.configService.get<string>('ai.groq.model');
      case 'openrouter':
        return this.configService.get<string>('ai.openrouter.model');
      case 'huggingface':
        return this.configService.get<string>('ai.huggingface.model');
      case 'cloudflare':
        return this.configService.get<string>('ai.cloudflare.model');
      case 'openai':
        return this.configService.get<string>('ai.openai.model');
      case 'anthropic':
        return this.configService.get<string>('ai.anthropic.model');
      case 'gemini':
        return this.configService.get<string>('ai.gemini.model');
      case 'ollama':
        return this.configService.get<string>('ai.ollama.model');
      default:
        return undefined;
    }
  }

  private async recordExecution(input: {
    workspaceId: string;
    aiAnalysisId?: string;
    provider: string;
    model?: string;
    success: boolean;
    latencyMs?: number;
    responseMeta?: Record<string, unknown>;
  }) {
    await this.prisma.providerExecution.create({
      data: {
        workspaceId: input.workspaceId,
        aiAnalysisId: input.aiAnalysisId,
        provider: input.provider,
        model: input.model,
        success: input.success,
        latencyMs: input.latencyMs,
        responseMeta: input.responseMeta as Prisma.InputJsonValue | undefined,
      },
    });
  }

  private async recordFailure(input: {
    workspaceId: string;
    aiAnalysisId?: string;
    provider: string;
    errorMessage: string;
  }) {
    await this.prisma.providerFailure.create({
      data: {
        workspaceId: input.workspaceId,
        aiAnalysisId: input.aiAnalysisId,
        provider: input.provider,
        errorCode: /429/.test(input.errorMessage) ? '429' : 'PROVIDER_ERROR',
        errorMessage: input.errorMessage.slice(0, 4000),
        retriable: this.isRetriableProviderError(input.errorMessage),
      },
    });
  }
}
