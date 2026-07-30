import {
  hasSourceCodeExtension,
  isSkippableSourcePath,
  sourceCodePriority,
} from '../constants/source-code.constants';

describe('source-code constants', () => {
  it('accepts ts/js extensions', () => {
    expect(hasSourceCodeExtension('src/a.ts')).toBe(true);
    expect(hasSourceCodeExtension('src/a.tsx')).toBe(true);
    expect(hasSourceCodeExtension('src/a.md')).toBe(false);
  });

  it('skips node_modules and dist', () => {
    expect(isSkippableSourcePath('apps/backend/node_modules/x/index.js')).toBe(
      true,
    );
    expect(isSkippableSourcePath('apps/backend/dist/main.js')).toBe(true);
    expect(
      isSkippableSourcePath('apps/backend/src/modules/identity/jwt.guard.ts'),
    ).toBe(false);
  });

  it('prioritizes embeddings/search above auth under free-tier cap', () => {
    const auth = sourceCodePriority(
      'apps/backend/src/modules/identity/jwt-auth.guard.ts',
    );
    const embeddingStorage = sourceCodePriority(
      'apps/backend/src/modules/embeddings/services/embedding-storage.service.ts',
    );
    const other = sourceCodePriority('apps/backend/src/app.controller.ts');
    expect(auth).toBeGreaterThan(other);
    expect(embeddingStorage).toBeGreaterThan(auth);
  });
});
