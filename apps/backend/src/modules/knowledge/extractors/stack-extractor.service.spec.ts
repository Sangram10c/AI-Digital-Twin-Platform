import { StackExtractorService } from './stack-extractor.service';

describe('StackExtractorService', () => {
  let service: StackExtractorService;

  beforeEach(() => {
    service = new StackExtractorService();
  });

  it('detects frameworks and libraries from package.json', () => {
    const result = service.extractFromPackageJson(
      JSON.stringify({
        name: 'demo-app',
        dependencies: {
          '@nestjs/core': '11.0.0',
          '@prisma/client': '7.0.0',
          axios: '1.0.0',
          'left-pad': '1.0.0',
        },
        devDependencies: {
          jest: '30.0.0',
        },
      }),
    );

    expect(result.packageName).toBe('demo-app');
    expect(result.frameworks.map((f) => f.name)).toContain('nestjs');
    expect(result.libraries.map((l) => l.name)).toEqual(
      expect.arrayContaining(['prisma', 'axios', 'jest']),
    );
    expect(
      result.otherDependencies.some((d) => d.npmPackage === 'left-pad'),
    ).toBe(true);
  });

  it('maps import usages to files and symbols', () => {
    const extracted = service.extractFromPackageJson(
      JSON.stringify({
        dependencies: {
          '@nestjs/core': '11.0.0',
          '@prisma/client': '7.0.0',
        },
      }),
    );

    const usage = service.buildUsageFromSourceFiles(
      [
        {
          path: 'src/app.service.ts',
          content: `
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class AppService {
  getHello() { return 'ok'; }
}
`,
        },
      ],
      [...extracted.frameworks, ...extracted.libraries],
    );

    expect(usage.some((u) => u.npmPackage === '@prisma/client')).toBe(true);
    expect(usage[0]?.filePath).toBe('src/app.service.ts');
    expect(usage[0]?.symbols).toEqual(expect.arrayContaining(['AppService']));
  });

  it('builds AI-readable summary including usage', () => {
    const profile = {
      detectedAt: '2026-01-01T00:00:00.000Z',
      manifestPath: 'package.json',
      manifestPaths: ['package.json', 'apps/backend/package.json'],
      packageName: 'demo',
      packageManager: 'npm' as const,
      frameworks: [
        {
          name: 'nestjs',
          category: 'framework' as const,
          ecosystem: 'node',
          npmPackage: '@nestjs/core',
          version: '11.0.0',
        },
      ],
      libraries: [],
      otherDependencies: [],
      usage: [
        {
          name: 'nestjs',
          npmPackage: '@nestjs/core',
          filePath: 'src/main.ts',
          symbols: ['bootstrap'],
          importLine: '@nestjs/core',
        },
      ],
      summary: '',
    };

    const summary = service.buildAiReadableSummary(profile);
    expect(summary).toContain('nestjs');
    expect(summary).toContain('src/main.ts');
    expect(summary).toContain('bootstrap');
    expect(summary).toContain('apps/backend/package.json');
  });

  it('merges monorepo package.json extractions', () => {
    const root = service.extractFromPackageJson(
      JSON.stringify({
        name: 'mono',
        devDependencies: { prettier: '3.0.0' },
      }),
      { manifestPath: 'package.json' },
    );
    const backend = service.extractFromPackageJson(
      JSON.stringify({
        name: 'backend',
        dependencies: {
          '@nestjs/core': '11.0.0',
          '@prisma/client': '7.0.0',
        },
      }),
      { manifestPath: 'apps/backend/package.json' },
    );

    const merged = service.mergeExtractions([root, backend]);
    expect(merged.frameworks.map((f) => f.name)).toContain('nestjs');
    expect(merged.libraries.map((l) => l.name)).toContain('prisma');
    expect(merged.manifestPaths).toEqual(
      expect.arrayContaining(['package.json', 'apps/backend/package.json']),
    );
  });
});
