import { ConfigService } from '@nestjs/config';
import { AiProvidersService } from './ai-providers.service';
import { AiProviderRateLimiterService } from './ai-provider-rate-limiter.service';

describe('AiProvidersService config logic', () => {
  const config = {
    get: jest.fn(),
  };
  const rateLimiter = {
    schedule: jest.fn(async <T>(fn: () => Promise<T>) => fn()),
  };

  let service: AiProvidersService;

  beforeEach(() => {
    jest.clearAllMocks();
    rateLimiter.schedule.mockImplementation(async <T>(fn: () => Promise<T>) =>
      fn(),
    );
    service = new AiProvidersService(
      config as never as ConfigService,
      rateLimiter as never as AiProviderRateLimiterService,
    );
  });

  it('returns configured default provider', () => {
    config.get.mockReturnValue('gemini');
    expect(service.getDefaultProvider()).toBe('gemini');
  });

  it('builds free-tier failover list excluding the primary provider', () => {
    const providers = service.getFailoverProviders('groq');
    expect(providers).toEqual([
      'openrouter',
      'huggingface',
      'cloudflare',
      'gemini',
    ]);
    expect(providers).not.toContain('groq');
    expect(providers).not.toContain('openai');
    expect(providers).not.toContain('anthropic');
  });
});
