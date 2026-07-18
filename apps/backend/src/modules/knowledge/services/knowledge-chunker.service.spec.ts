import { ContentCleanerService } from '../normalizers/content-cleaner.service';
import { MarkdownParserService } from '../parsers/markdown-parser.service';
import { KnowledgeChunkerService } from './knowledge-chunker.service';

describe('ContentCleanerService', () => {
  let service: ContentCleanerService;

  beforeEach(() => {
    service = new ContentCleanerService();
  });

  it('normalizes whitespace without altering fenced code blocks', () => {
    const input = 'Hello   world\n\n```ts\nconst x  =  1;\n```\n\nFooter';
    const cleaned = service.clean(input);
    expect(cleaned).toContain('```ts\nconst x  =  1;\n```');
    expect(cleaned).toContain('Hello world');
  });

  it('strips basic HTML while preserving text', () => {
    const cleaned = service.clean('<p>Hello<br/>World</p>');
    expect(cleaned).toBe('Hello\nWorld');
  });
});

describe('MarkdownParserService', () => {
  let parser: MarkdownParserService;

  beforeEach(() => {
    parser = new MarkdownParserService();
  });

  it('splits markdown by headings', () => {
    const sections = parser.splitByHeadings(
      '# Title\n\nIntro\n\n## Section\n\nBody',
    );
    expect(sections.length).toBeGreaterThanOrEqual(2);
    expect(sections[1].heading).toBe('Section');
  });
});

describe('KnowledgeChunkerService', () => {
  let chunker: KnowledgeChunkerService;

  beforeEach(() => {
    chunker = new KnowledgeChunkerService(new MarkdownParserService());
  });

  it('creates ordered chunks with metadata', () => {
    const content = '# Heading\n\nParagraph one.\n\nParagraph two.';
    const chunks = chunker.chunkDocument(content, 200);
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].chunkIndex).toBe(0);
    expect(chunks[0].contentHash).toHaveLength(64);
  });

  it('splits oversized sections into multiple chunks', () => {
    const longParagraph = 'word '.repeat(500).trim();
    const chunks = chunker.chunkDocument(longParagraph, 300);
    expect(chunks.length).toBeGreaterThan(1);
  });
});
