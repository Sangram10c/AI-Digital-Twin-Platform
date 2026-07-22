import { AiProviderFallbackService } from './ai-provider-fallback.service';

describe('AiProviderFallbackService', () => {
  const providers = {
    generateStructuredJson: jest.fn(),
  };
  const configService = {
    get: jest.fn((key: string) => {
      const map: Record<string, unknown> = {
        'ai.defaultProvider': 'groq',
        'ai.billingMode': 'free_only',
        'ai.providerFallback': true,
        'ai.groq.apiKey': 'g-key',
        'ai.groq.model': 'llama-3.1-8b-instant',
        'ai.openrouter.apiKey': 'or-key',
        'ai.openrouter.model': 'meta-llama/llama-3.2-3b-instruct:free',
        'ai.huggingface.apiKey': 'hf-key',
        'ai.cloudflare.apiToken': 'cf-token',
        'ai.cloudflare.accountId': 'acct',
        'ai.gemini.apiKey': 'gem-key',
        'ai.openai.apiKey': 'o-key',
        'ai.anthropic.apiKey': 'a-key',
        'ai.ollama.enabled': true,
        'ai.ollama.model': 'llama3.2:1b',
        'app.nodeEnv': 'development',
      };
      return map[key];
    }),
  };
  const prisma = {
    providerExecution: { create: jest.fn() },
    providerFailure: { create: jest.fn() },
  };

  let service: AiProviderFallbackService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AiProviderFallbackService(
      providers as never,
      configService as never,
      prisma as never,
    );
  });

  it('tries cloud providers in order and does not include ollama', () => {
    const chain = service.getProviderPriority();
    expect(chain[0]).toBe('groq');
    expect(chain).toContain('openrouter');
    expect(chain).toContain('huggingface');
    expect(chain).toContain('cloudflare');
    expect(chain).not.toContain('ollama');
    expect(chain).not.toContain('openai');
    expect(chain).not.toContain('anthropic');
  });

  it('falls back to the next cloud provider on 429', async () => {
    providers.generateStructuredJson
      .mockRejectedValueOnce(new Error('429 quota exceeded'))
      .mockResolvedValueOnce({
        provider: 'openrouter',
        model: 'openai/gpt-4o-mini',
        rawText: '{"ok":true}',
        output: { ok: true },
        latencyMs: 12,
      });

    const result = await service.generateWithFallback(
      { systemPrompt: 'sys', userPrompt: 'user' },
      { workspaceId: 'ws-1' },
    );

    expect(result.provider).toBe('openrouter');
    expect(result.fallbackUsed).toBe(true);
    expect(result.allCloudProvidersFailed).toBe(false);
  });

  it('reports allCloudProvidersFailed when every cloud provider fails', async () => {
    providers.generateStructuredJson.mockRejectedValue(
      new Error('credits exhausted'),
    );

    const result = await service.generateWithFallback(
      { systemPrompt: 'sys', userPrompt: 'user' },
      { workspaceId: 'ws-1' },
    );

    expect(result.allCloudProvidersFailed).toBe(true);
    expect(result.failedProviders.length).toBeGreaterThan(0);
  });

  it('blocks ollama in production', async () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'app.nodeEnv') return 'production';
      if (key === 'ai.ollama.enabled') return true;
      return undefined;
    });
    expect(service.isProviderEnabled('ollama')).toBe(false);
    const last = await service.tryOllamaLastResort(
      { systemPrompt: 's', userPrompt: 'u' },
      { workspaceId: 'ws-1' },
    );
    expect(last).toBeNull();
  });

  it('detects insufficient heuristics', () => {
    expect(
      service.isHeuristicsInsufficient({
        confidenceScore: 0.05,
        frameworks: [],
        modules: [],
        technologies: [],
      }),
    ).toBe(true);
    expect(
      service.isHeuristicsInsufficient({
        confidenceScore: 0.8,
        frameworks: ['NestJS'],
        modules: [],
        technologies: [],
      }),
    ).toBe(false);
  });
});
