import { DocumentationCrawlerService } from './documentation-crawler.service';

describe('DocumentationCrawlerService path rules', () => {
  const service = Object.create(
    DocumentationCrawlerService.prototype,
  ) as DocumentationCrawlerService;

  it('accepts README and docs markdown', () => {
    expect(service.isDocumentationPath('README.md')).toBe(true);
    expect(service.isDocumentationPath('docs/guide.md')).toBe(true);
    expect(service.isDocumentationPath('architecture/overview.md')).toBe(true);
    expect(service.isDocumentationPath('.github/SECURITY.md')).toBe(true);
    expect(service.isDocumentationPath('LICENSE')).toBe(true);
  });

  it('skips binaries and vendor paths', () => {
    expect(service.isDocumentationPath('docs/logo.png')).toBe(false);
    expect(service.isDocumentationPath('node_modules/pkg/README.md')).toBe(
      false,
    );
    expect(service.isDocumentationPath('dist/readme.md')).toBe(false);
  });

  it('maps documentation types', () => {
    expect(service.mapDocumentationType('README.md')).toBe('README');
    expect(service.mapDocumentationType('CHANGELOG.md')).toBe('CHANGELOG');
    expect(service.mapDocumentationType('adr/0001.md')).toBe('ADR');
    expect(service.mapDocumentationType('api/openapi.md')).toBe('API_DOC');
  });
});
