import { Injectable } from '@nestjs/common';
import { KNOWN_NPM_PACKAGES } from '../constants/known-packages.constants';
import {
  RepositoryStackProfile,
  StackPackageRef,
  StackUsageLocation,
} from '../interfaces/stack.interfaces';

interface PackageJsonShape {
  name?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  packageManager?: string;
}

@Injectable()
export class StackExtractorService {
  extractFromPackageJson(
    packageJsonRaw: string,
    options: { manifestPath?: string } = {},
  ): Omit<RepositoryStackProfile, 'usage' | 'detectedAt' | 'summary'> & {
    summarySeed: {
      frameworks: string[];
      libraries: string[];
    };
  } {
    const parsed = JSON.parse(packageJsonRaw) as PackageJsonShape;
    const frameworks = new Map<string, StackPackageRef>();
    const libraries = new Map<string, StackPackageRef>();
    const otherDependencies: StackPackageRef[] = [];

    const consume = (
      entries: Record<string, string> | undefined,
      isDev: boolean,
    ) => {
      if (!entries) return;
      for (const [npmPackage, version] of Object.entries(entries)) {
        const known = KNOWN_NPM_PACKAGES[npmPackage];
        if (known) {
          const ref: StackPackageRef = {
            name: known.name,
            category: known.category,
            ecosystem: known.ecosystem,
            npmPackage,
            version,
            isDevDependency: isDev,
            manifestPath: options.manifestPath ?? 'package.json',
          };
          if (known.category === 'framework') {
            frameworks.set(known.name, ref);
          } else {
            libraries.set(`${known.name}:${npmPackage}`, ref);
          }
          continue;
        }

        otherDependencies.push({
          name: npmPackage,
          category: 'dependency',
          ecosystem: 'node',
          npmPackage,
          version,
          isDevDependency: isDev,
          manifestPath: options.manifestPath ?? 'package.json',
        });
      }
    };

    consume(parsed.dependencies, false);
    consume(parsed.devDependencies, true);

    return {
      manifestPath: options.manifestPath ?? 'package.json',
      manifestPaths: [options.manifestPath ?? 'package.json'],
      packageName: parsed.name,
      packageManager: this.detectPackageManager(parsed),
      frameworks: [...frameworks.values()],
      libraries: [...libraries.values()],
      otherDependencies,
      summarySeed: {
        frameworks: [...frameworks.keys()],
        libraries: [
          ...new Set([...libraries.values()].map((item) => item.name)),
        ],
      },
    };
  }

  /**
   * Merge several package.json extractions (root + apps/* + packages/*).
   */
  mergeExtractions(
    parts: Array<ReturnType<StackExtractorService['extractFromPackageJson']>>,
  ): Omit<RepositoryStackProfile, 'usage' | 'detectedAt' | 'summary'> {
    const frameworks = new Map<string, StackPackageRef>();
    const libraries = new Map<string, StackPackageRef>();
    const otherDependencies: StackPackageRef[] = [];
    const manifestPaths: string[] = [];

    for (const part of parts) {
      manifestPaths.push(part.manifestPath);
      for (const fw of part.frameworks) {
        frameworks.set(fw.name, fw);
      }
      for (const lib of part.libraries) {
        libraries.set(`${lib.name}:${lib.npmPackage}`, lib);
      }
      otherDependencies.push(...part.otherDependencies);
    }

    const root =
      parts.find((p) => p.manifestPath === 'package.json') ?? parts[0];

    return {
      manifestPath: root?.manifestPath ?? 'package.json',
      manifestPaths: [...new Set(manifestPaths)],
      packageName: root?.packageName,
      packageManager: root?.packageManager ?? 'npm',
      frameworks: [...frameworks.values()],
      libraries: [...libraries.values()],
      otherDependencies,
    };
  }

  buildUsageFromSourceFiles(
    files: Array<{ path: string; content: string }>,
    trackedPackages: StackPackageRef[],
  ): StackUsageLocation[] {
    const usage: StackUsageLocation[] = [];

    for (const file of files) {
      const imports = this.extractImports(file.content);
      const symbols = this.extractNearbySymbols(file.content);

      for (const imported of imports) {
        const tracked = trackedPackages.find(
          (pkg) =>
            imported === pkg.npmPackage ||
            imported.startsWith(`${pkg.npmPackage}/`),
        );
        if (!tracked) continue;

        usage.push({
          name: tracked.name,
          npmPackage: tracked.npmPackage,
          filePath: file.path,
          symbols,
          importLine: imported,
        });
      }
    }

    return this.dedupeUsage(usage);
  }

  buildAiReadableSummary(profile: RepositoryStackProfile): string {
    const lines: string[] = [
      `# Repository stack (from package.json)`,
      '',
      profile.packageName ? `Package name: ${profile.packageName}` : '',
      `Package manager: ${profile.packageManager}`,
      `Detected at: ${profile.detectedAt}`,
      `Manifests scanned: ${profile.manifestPaths.join(', ')}`,
      '',
      '## Frameworks',
    ];

    if (profile.frameworks.length === 0) {
      lines.push('- None detected from known package map');
    } else {
      for (const fw of profile.frameworks) {
        lines.push(
          `- ${fw.name} (npm: ${fw.npmPackage}${fw.version ? `@${fw.version}` : ''}${fw.manifestPath ? `; from ${fw.manifestPath}` : ''})`,
        );
      }
    }

    lines.push('', '## Libraries');
    if (profile.libraries.length === 0) {
      lines.push('- None detected from known package map');
    } else {
      for (const lib of profile.libraries) {
        lines.push(
          `- ${lib.name} (npm: ${lib.npmPackage}${lib.version ? `@${lib.version}` : ''}${lib.manifestPath ? `; from ${lib.manifestPath}` : ''})`,
        );
      }
    }

    lines.push('', '## Usage by file (import scan)');
    if (profile.usage.length === 0) {
      lines.push(
        '- No import usages found in scanned source files (or scan skipped).',
      );
    } else {
      for (const item of profile.usage) {
        const symbols =
          item.symbols.length > 0
            ? ` symbols: ${item.symbols.slice(0, 8).join(', ')}`
            : '';
        lines.push(
          `- ${item.name} (${item.npmPackage}) used in \`${item.filePath}\`${symbols}`,
        );
      }
    }

    lines.push(
      '',
      '## How to answer questions',
      'Use this document to answer: which frameworks/libraries this repository uses,',
      'and which scanned source files import them. Function-level detection is best-effort from exported symbols in those files.',
      'For monorepos, dependencies are merged from root and workspace package.json files (apps/*, packages/*).',
    );

    return lines.filter((line) => line !== '').join('\n');
  }

  private detectPackageManager(
    parsed: PackageJsonShape,
  ): RepositoryStackProfile['packageManager'] {
    const pm = parsed.packageManager?.toLowerCase() ?? '';
    if (pm.startsWith('pnpm')) return 'pnpm';
    if (pm.startsWith('yarn')) return 'yarn';
    if (pm.startsWith('npm')) return 'npm';
    return 'npm';
  }

  private extractImports(content: string): string[] {
    const results = new Set<string>();
    const patterns = [
      /from\s+['"]([^'"]+)['"]/g,
      /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
      /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    ];

    for (const pattern of patterns) {
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(content)) !== null) {
        if (match[1] && !match[1].startsWith('.')) {
          results.add(match[1]);
        }
      }
    }

    return [...results];
  }

  private extractNearbySymbols(content: string): string[] {
    const symbols = new Set<string>();
    const patterns = [
      /export\s+(?:async\s+)?function\s+([A-Za-z0-9_]+)/g,
      /export\s+class\s+([A-Za-z0-9_]+)/g,
      /export\s+const\s+([A-Za-z0-9_]+)/g,
      /@(?:Injectable|Controller|Module)\(\)/g,
    ];

    for (const pattern of patterns) {
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(content)) !== null) {
        if (match[1]) symbols.add(match[1]);
      }
    }

    // NestJS-style class names even without export keyword near decorator
    const classPattern =
      /(?:@Injectable|@Controller|@Module)[\s\S]{0,80}class\s+([A-Za-z0-9_]+)/g;
    let classMatch: RegExpExecArray | null;
    while ((classMatch = classPattern.exec(content)) !== null) {
      if (classMatch[1]) symbols.add(classMatch[1]);
    }

    return [...symbols].slice(0, 20);
  }

  private dedupeUsage(usage: StackUsageLocation[]): StackUsageLocation[] {
    const map = new Map<string, StackUsageLocation>();
    for (const item of usage) {
      const key = `${item.npmPackage}::${item.filePath}`;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, item);
        continue;
      }
      map.set(key, {
        ...existing,
        symbols: [...new Set([...existing.symbols, ...item.symbols])],
      });
    }
    return [...map.values()];
  }
}
