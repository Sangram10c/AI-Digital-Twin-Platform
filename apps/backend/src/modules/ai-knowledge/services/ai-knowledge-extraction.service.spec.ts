import { AiKnowledgeExtractionService } from './ai-knowledge-extraction.service';

describe('AiKnowledgeExtractionService', () => {
  const storage = {
    loadAnalysisDocument: jest.fn(),
    readExtractionMetadata: jest.fn(),
    saveExtraction: jest.fn(),
  };
  const providers = {
    generateStructuredJson: jest.fn(),
  };
  const heuristics = {
    enrich: jest.fn(),
  };

  let service: AiKnowledgeExtractionService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AiKnowledgeExtractionService(
      storage as never,
      providers as never,
      heuristics as never,
    );
  });

  it('skips unchanged completed extraction', async () => {
    storage.loadAnalysisDocument.mockResolvedValue({
      id: 'doc-1',
      title: 'Repo',
      content: 'hello',
      contentChecksum: 'abc',
      metadata: {},
      kind: 'repository',
    });
    storage.readExtractionMetadata.mockReturnValue({
      status: 'COMPLETED',
      contentChecksum: 'abc',
      promptVersion: 1,
      result: { summary: 'ok' },
    });

    const result = await service.analyze('repository', 'doc-1');

    expect(result.status).toBe('SKIPPED');
    expect(providers.generateStructuredJson).not.toHaveBeenCalled();
  });

  it('calls provider and stores merged extraction', async () => {
    storage.loadAnalysisDocument.mockResolvedValue({
      id: 'doc-2',
      title: 'Commit',
      content: 'fix oauth bug',
      contentChecksum: 'def',
      metadata: { commitSha: 'abc123' },
      kind: 'commit',
    });
    storage.readExtractionMetadata.mockReturnValue(undefined);
    providers.generateStructuredJson.mockResolvedValue({
      provider: 'openai',
      model: 'gpt',
      rawText: '{"summary":"Fix OAuth bug","topics":["oauth"]}',
      output: { summary: 'Fix OAuth bug', topics: ['oauth'], bugFix: true },
      latencyMs: 50,
    });
    heuristics.enrich.mockResolvedValue({
      topics: ['oauth', 'security'],
      modules: ['authentication'],
      technologies: ['OpenAI'],
      keywords: ['oauth', 'security'],
      relationships: [],
    });

    const result = await service.analyze('commit', 'doc-2');

    expect(result.status).toBe('COMPLETED');
    expect(result.result?.summary).toBe('Fix OAuth bug');
    expect(result.result?.topics).toEqual(['oauth', 'security']);
    expect(storage.saveExtraction).toHaveBeenCalled();
  });
});
