import { LanguageDetectorService } from '../extractors/language-detector.service';
import { DetectedLanguageKind } from '../interfaces/knowledge.interfaces';

describe('LanguageDetectorService', () => {
  let detector: LanguageDetectorService;

  beforeEach(() => {
    detector = new LanguageDetectorService();
  });

  it('detects programming language from file extension', () => {
    const result = detector.detect('export const x = 1;', 'src/app.ts');
    expect(result.language).toBe('typescript');
    expect(result.kind).toBe(DetectedLanguageKind.PROGRAMMING);
  });

  it('detects markdown content', () => {
    const result = detector.detect('# Title\n\n- item', 'README.md');
    expect(result.language).toBe('markdown');
    expect(result.kind).toBe(DetectedLanguageKind.MARKDOWN);
  });

  it('detects json payloads', () => {
    const result = detector.detect('{"name":"demo"}');
    expect(result.language).toBe('json');
    expect(result.kind).toBe(DetectedLanguageKind.JSON);
  });
});
