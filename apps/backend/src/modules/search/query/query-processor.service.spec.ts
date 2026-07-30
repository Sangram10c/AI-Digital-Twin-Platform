import { QueryProcessor } from './query-processor.service';
import { SEARCH_QUERY_EXPANSIONS } from '../constants/search.constants';

describe('QueryProcessor', () => {
  const processor = new QueryProcessor();

  it('normalizes whitespace and lowercases', () => {
    const result = processor.process('  How   Does JWT   Work?  ');
    expect(result.normalized).toBe('how does jwt work?');
  });

  it('removes stop words and extracts keywords', () => {
    const result = processor.process('the authentication for the api');
    expect(result.keywords).toEqual(
      expect.arrayContaining(['authentication', 'api']),
    );
    expect(result.keywords).not.toEqual(expect.arrayContaining(['the', 'for']));
  });

  it('expands known synonyms', () => {
    const result = processor.process('auth db');
    for (const term of SEARCH_QUERY_EXPANSIONS.auth) {
      expect(result.expandedTerms).toContain(term);
    }
    expect(result.expandedTerms).toEqual(
      expect.arrayContaining(SEARCH_QUERY_EXPANSIONS.db),
    );
  });

  it('extracts repository aliases', () => {
    const result = processor.process('repo:backend how does search work');
    expect(result.repositoryAliases).toContain('backend');
    expect(result.normalized).not.toContain('repo:backend');
  });

  it('builds phrase and prefix tsquery parts', () => {
    const result = processor.process('"jwt auth" nestjs');
    expect(result.phrases).toContain('jwt auth');
    expect(result.tsQuery).toContain('<->');
    expect(result.tsQuery).toContain('nestjs:*');
  });

  it('detects english for ascii text', () => {
    expect(processor.process('hello world').language).toBe('en');
  });

  it('puts synonym expansions into tsQuery (not only embeddingText)', () => {
    const result = processor.process('pgvector embedding vector storage');
    expect(result.expandedTerms).toEqual(
      expect.arrayContaining(['embedding-storage', 'upsert', 'hnsw']),
    );
    expect(result.tsQuery).toMatch(/upsert:\*/);
    expect(result.tsQuery).toMatch(/hnsw:\*/);
    expect(result.tsQuery).toMatch(/embedding:\*/);
  });
});
