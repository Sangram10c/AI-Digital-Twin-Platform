import { CodeSymbolChunkerService } from './code-symbol-chunker.service';

describe('CodeSymbolChunkerService', () => {
  const chunker = new CodeSymbolChunkerService();

  const sample = `
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private readonly jwt: JwtService) {}

  async validateUser(email: string, password: string) {
    return { email };
  }

  signToken(userId: string) {
    return this.jwt.sign({ sub: userId });
  }
}

export function createTokenPayload(userId: string) {
  return { sub: userId };
}
`.trim();

  it('creates file header and symbol chunks', () => {
    const drafts = chunker.chunkCode(
      sample,
      'apps/backend/src/modules/identity/auth.service.ts',
    );
    expect(drafts.length).toBeGreaterThanOrEqual(2);
    expect(drafts.some((d) => d.metadata.symbolKind === 'file_header')).toBe(
      true,
    );
    expect(
      drafts.some(
        (d) =>
          d.metadata.symbolName === 'AuthService' &&
          d.metadata.symbolKind === 'class',
      ),
    ).toBe(true);
    expect(drafts.some((d) => String(d.content).includes('signToken'))).toBe(
      true,
    );
  });

  it('tags chunks as source_code with filePath', () => {
    const drafts = chunker.chunkCode(sample, 'src/auth/jwt.strategy.ts');
    for (const d of drafts) {
      expect(d.metadata.documentType).toBe('source_code');
      expect(d.metadata.filePath).toBe('src/auth/jwt.strategy.ts');
    }
  });
});
