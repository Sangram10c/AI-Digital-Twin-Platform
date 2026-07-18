export interface StackPackageRef {
  name: string;
  category: 'framework' | 'library' | 'dependency';
  ecosystem: string;
  npmPackage: string;
  version?: string;
  isDevDependency?: boolean;
  /** Which package.json this came from (monorepo support) */
  manifestPath?: string;
}

export interface StackUsageLocation {
  /** Framework or library label (e.g. nestjs, prisma) */
  name: string;
  npmPackage: string;
  filePath: string;
  /** Best-effort exported/declared symbols near imports (not full AST) */
  symbols: string[];
  importLine?: string;
}

/**
 * AI-oriented stack profile stored on repository / knowledge metadata.
 */
export interface RepositoryStackProfile {
  detectedAt: string;
  /** Primary / root manifest */
  manifestPath: string;
  /** All package.json files scanned (monorepo) */
  manifestPaths: string[];
  packageName?: string;
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'unknown';
  frameworks: StackPackageRef[];
  libraries: StackPackageRef[];
  otherDependencies: StackPackageRef[];
  usage: StackUsageLocation[];
  summary: string;
}
